const { app, BrowserWindow, Menu, Tray, ipcMain, nativeImage, safeStorage, shell, screen } = require('electron');
const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const http = require('node:http');
const path = require('node:path');
const { getYandexOAuthClientId } = require('./yandex-oauth-app');

const API_BASE_URL = 'https://api.iot.yandex.net/v1.0';
const OAUTH_AUTHORIZE_URL = 'https://oauth.yandex.ru/authorize';
const OAUTH_TOKEN_URL = 'https://oauth.yandex.ru/token';
const OAUTH_REDIRECT_PORT = 42871;
const OAUTH_REDIRECT_PATH = '/oauth/yandex/callback';
const OAUTH_SCOPES = 'iot:view iot:control';

const DEFAULT_CONFIG = {
  runInTray: true,
  launchAtLogin: false,
  pollIntervalSec: 30,
  enableTaskbarWidget: false,
  theme: 'system',
  tilesAutoExpanded: true,
  taskbarWidgetBounds: null,
  deviceId: null,
  encryptedAuth: null,
  plainAuth: null,
  encryptedToken: null,
  plainToken: null,
  tileLayout: {},
  tileOrder: [],
  pinnedMetrics: []
};

let mainWindow = null;
let tray = null;
let isQuitting = false;
let configCache = { ...DEFAULT_CONFIG };
let oauthServer = null;
let oauthLoginState = null;
let trayMetricsText = '';
let taskbarWidgetWindow = null;
let taskbarWidgetSaveTimer = null;

function getConfigPath() {
  return path.join(app.getPath('userData'), 'config.json');
}

async function loadConfig() {
  try {
    const raw = await fs.readFile(getConfigPath(), 'utf8');
    configCache = { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch (error) {
    configCache = { ...DEFAULT_CONFIG };
  }

  if (!configCache.deviceId) {
    configCache.deviceId = crypto.randomUUID();
    await saveConfig(configCache);
  }

  return configCache;
}

async function saveConfig(nextConfig = configCache) {
  configCache = { ...DEFAULT_CONFIG, ...nextConfig };
  await fs.mkdir(app.getPath('userData'), { recursive: true });
  await fs.writeFile(getConfigPath(), JSON.stringify(configCache, null, 2), 'utf8');
  return configCache;
}

function encryptString(value) {
  if (safeStorage.isEncryptionAvailable()) {
    return {
      encrypted: safeStorage.encryptString(value).toString('base64'),
      plain: null
    };
  }

  return {
    encrypted: null,
    plain: value
  };
}

function decryptString(encryptedValue, plainValue) {
  if (encryptedValue && safeStorage.isEncryptionAvailable()) {
    return safeStorage.decryptString(Buffer.from(encryptedValue, 'base64'));
  }

  return plainValue || null;
}

function getAuthData() {
  try {
    const raw = decryptString(configCache.encryptedAuth, configCache.plainAuth);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    return null;
  }
}

async function setAuthData(authData) {
  if (!authData) {
    configCache.encryptedAuth = null;
    configCache.plainAuth = null;
    await saveConfig();
    return { hasToken: Boolean(getLegacyToken()) };
  }

  const packed = encryptString(JSON.stringify(authData));
  configCache.encryptedAuth = packed.encrypted;
  configCache.plainAuth = packed.plain;
  configCache.encryptedToken = null;
  configCache.plainToken = null;
  await saveConfig();
  return { hasToken: true, encrypted: Boolean(packed.encrypted) };
}

function getLegacyToken() {
  if (configCache.encryptedToken && safeStorage.isEncryptionAvailable()) {
    try {
      return safeStorage.decryptString(Buffer.from(configCache.encryptedToken, 'base64'));
    } catch (error) {
      return null;
    }
  }
  return configCache.plainToken || null;
}

async function setToken(token) {
  const trimmedToken = String(token || '').trim();

  if (!trimmedToken) {
    configCache.encryptedToken = null;
    configCache.plainToken = null;
    await setAuthData(null);
    await saveConfig();
    return { hasToken: false, encrypted: false };
  }

  const packed = encryptString(trimmedToken);
  configCache.encryptedToken = packed.encrypted;
  configCache.plainToken = packed.plain;
  await setAuthData(null);
  await saveConfig();
  return { hasToken: true, encrypted: Boolean(packed.encrypted) };
}

function base64Url(buffer) {
  return Buffer.from(buffer)
    .toString('base64')
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '');
}

function createPkcePair() {
  const verifier = base64Url(crypto.randomBytes(48));
  const challenge = base64Url(crypto.createHash('sha256').update(verifier).digest());
  return { verifier, challenge };
}

function getRedirectUri() {
  return `http://127.0.0.1:${OAUTH_REDIRECT_PORT}${OAUTH_REDIRECT_PATH}`;
}

function getDeviceName() {
  return `${app.getName()} on ${process.env.COMPUTERNAME || 'Windows'}`.slice(0, 100);
}

async function exchangeCodeForToken(code) {
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    client_id: oauthLoginState.clientId,
    code_verifier: oauthLoginState.codeVerifier,
    device_id: configCache.deviceId,
    device_name: getDeviceName()
  });

  const response = await fetch(OAUTH_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json'
    },
    body: params.toString()
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error_description || payload.error || `OAuth HTTP ${response.status}`);
  }

  const now = Date.now();
  await setAuthData({
    ...payload,
    expires_at: payload.expires_in ? now + payload.expires_in * 1000 : null,
    created_at: now
  });

  return payload;
}

async function refreshOAuthToken() {
  const auth = getAuthData();
  const clientId = getYandexOAuthClientId();
  if (!auth?.refresh_token || !clientId) {
    return null;
  }

  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: auth.refresh_token,
    client_id: clientId
  });

  const response = await fetch(OAUTH_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json'
    },
    body: params.toString()
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    await setAuthData(null);
    throw new Error(payload.error_description || payload.error || `OAuth refresh HTTP ${response.status}`);
  }

  const now = Date.now();
  const nextAuth = {
    ...auth,
    ...payload,
    refresh_token: payload.refresh_token || auth.refresh_token,
    expires_at: payload.expires_in ? now + payload.expires_in * 1000 : auth.expires_at,
    updated_at: now
  };

  await setAuthData(nextAuth);
  return nextAuth.access_token;
}

async function getAccessToken() {
  const auth = getAuthData();
  if (auth?.access_token) {
    const expiresAt = Number(auth.expires_at || 0);
    if (!expiresAt || expiresAt - 60_000 > Date.now()) {
      return auth.access_token;
    }
    return refreshOAuthToken();
  }

  return getLegacyToken();
}

function stopOAuthServer() {
  if (oauthServer) {
    oauthServer.close();
    oauthServer = null;
  }
}

function sendOAuthHtml(response, title, message) {
  response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  response.end(`<!doctype html><meta charset="utf-8"><title>${title}</title><body style="font-family:system-ui;padding:32px;background:#111827;color:#fff"><h1>${title}</h1><p>${message}</p><script>setTimeout(() => window.close(), 1200)</script></body>`);
}

async function startOAuthLogin() {
  const clientId = getYandexOAuthClientId();
  if (!clientId) {
    return {
      ok: false,
      code: 'OAUTH_CLIENT_ID_MISSING',
      message: 'Yandex OAuth ClientID is not configured in the app build.',
      redirectUri: getRedirectUri(),
      scope: OAUTH_SCOPES
    };
  }

  stopOAuthServer();

  const pkce = createPkcePair();
  oauthLoginState = {
    clientId,
    state: base64Url(crypto.randomBytes(24)),
    codeVerifier: pkce.verifier
  };

  oauthServer = http.createServer(async (request, response) => {
    const url = new URL(request.url, getRedirectUri());
    if (url.pathname !== OAUTH_REDIRECT_PATH) {
      response.writeHead(404);
      response.end('Not found');
      return;
    }

    try {
      const oauthError = url.searchParams.get('error');
      if (oauthError) {
        throw new Error(url.searchParams.get('error_description') || oauthError);
      }

      if (url.searchParams.get('state') !== oauthLoginState.state) {
        throw new Error('OAuth state не совпадает.');
      }

      const code = url.searchParams.get('code');
      if (!code) {
        throw new Error('Яндекс OAuth не вернул code.');
      }

      await exchangeCodeForToken(code);
      sendOAuthHtml(response, 'Вход выполнен', 'Можно вернуться в приложение.');
      mainWindow?.webContents.send('auth:login-complete', { ok: true });
    } catch (error) {
      sendOAuthHtml(response, 'Ошибка входа', error.message);
      mainWindow?.webContents.send('auth:login-complete', { ok: false, error: error.message });
    } finally {
      oauthLoginState = null;
      stopOAuthServer();
    }
  });

  await new Promise((resolve, reject) => {
    oauthServer.once('error', reject);
    oauthServer.listen(OAUTH_REDIRECT_PORT, '127.0.0.1', resolve);
  });

  const authorizeUrl = new URL(OAUTH_AUTHORIZE_URL);
  authorizeUrl.searchParams.set('response_type', 'code');
  authorizeUrl.searchParams.set('client_id', clientId);
  authorizeUrl.searchParams.set('redirect_uri', getRedirectUri());
  authorizeUrl.searchParams.set('scope', OAUTH_SCOPES);
  authorizeUrl.searchParams.set('state', oauthLoginState.state);
  authorizeUrl.searchParams.set('device_id', configCache.deviceId);
  authorizeUrl.searchParams.set('device_name', getDeviceName());
  authorizeUrl.searchParams.set('code_challenge', pkce.challenge);
  authorizeUrl.searchParams.set('code_challenge_method', 'S256');

  await shell.openExternal(authorizeUrl.toString());
  return {
    ok: true,
    redirectUri: getRedirectUri(),
    scope: OAUTH_SCOPES
  };
}

function createTrayIcon() {
  return nativeImage.createFromPath(path.join(__dirname, '../assets/tray.png'));
}

function updateTrayMenu() {
  if (!tray) {
    return;
  }

  const template = [
    {
      label: 'Показать',
      click: () => showMainWindow()
    },
    {
      label: 'Обновить устройства',
      click: () => mainWindow?.webContents.send('home:refresh-requested')
    },
    { type: 'separator' },
    {
      label: 'Выход',
      click: () => {
        isQuitting = true;
        app.quit();
      }
    }
  ];

  tray.setContextMenu(Menu.buildFromTemplate(template));
  tray.setToolTip(['Yandex Smart Home', trayMetricsText].filter(Boolean).join('\n'));
}

function createTray() {
  if (tray) {
    return;
  }

  tray = new Tray(createTrayIcon());
  tray.on('click', () => showMainWindow());
  updateTrayMenu();
}

function getTaskbarWidgetHtml() {
  return `<!doctype html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <style>
    html, body {
      width: 100%;
      height: 100%;
      margin: 0;
      overflow: hidden;
      background: transparent;
      font: 12px "Segoe UI", system-ui, sans-serif;
      color: #f4f7ff;
      user-select: none;
    }
    body {
      padding: 6px;
    }
    .widget {
      width: 100%;
      height: 100%;
      display: grid;
      grid-template-columns: auto minmax(0, 1fr);
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      border-radius: 14px;
      background: linear-gradient(135deg, rgba(31, 58, 96, 0.96), rgba(21, 34, 58, 0.94));
      box-shadow: 0 14px 34px rgba(0, 0, 0, 0.32), inset 0 0 0 1px rgba(255, 255, 255, 0.16);
      -webkit-app-region: drag;
    }
    .mark {
      width: 28px;
      height: 28px;
      border-radius: 10px;
      background: radial-gradient(circle at 35% 30%, #fff 0 10%, #8f72ff 11% 45%, #4fd18b 46% 100%);
      box-shadow: 0 6px 18px rgba(79, 209, 139, 0.32);
    }
    #metrics {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: normal;
      line-height: 1.25;
      font-weight: 650;
    }
    .resize-corner {
      position: absolute;
      right: 8px;
      bottom: 7px;
      width: 12px;
      height: 12px;
      border-right: 2px solid rgba(255, 255, 255, 0.32);
      border-bottom: 2px solid rgba(255, 255, 255, 0.32);
      pointer-events: none;
    }
  </style>
</head>
<body><div class="widget"><div class="mark"></div><div id="metrics">Yandex Smart Home</div><div class="resize-corner"></div></div></body>
</html>`;
}

function getTaskbarWidgetBounds(text = '') {
  if (configCache.taskbarWidgetBounds) {
    return configCache.taskbarWidgetBounds;
  }

  const display = screen.getPrimaryDisplay();
  const bounds = display.bounds;
  const taskbarHeight = Math.max(40, bounds.height - display.workArea.height);
  const width = Math.max(280, Math.min(560, String(text || '').length * 7 + 76));
  const height = Math.max(56, Math.min(96, taskbarHeight + 20));

  return {
    width,
    height,
    x: bounds.x + bounds.width - width - 360,
    y: bounds.y + bounds.height - height - 8
  };
}

function saveTaskbarWidgetBounds() {
  if (!taskbarWidgetWindow || taskbarWidgetWindow.isDestroyed()) {
    return;
  }

  configCache.taskbarWidgetBounds = taskbarWidgetWindow.getBounds();
  clearTimeout(taskbarWidgetSaveTimer);
  taskbarWidgetSaveTimer = setTimeout(() => {
    saveConfig(configCache).catch(() => {});
  }, 350);
}

function createTaskbarWidget() {
  if (taskbarWidgetWindow || !configCache.enableTaskbarWidget) {
    return;
  }

  taskbarWidgetWindow = new BrowserWindow({
    ...getTaskbarWidgetBounds(trayMetricsText),
    frame: false,
    transparent: true,
    resizable: true,
    movable: true,
    focusable: true,
    skipTaskbar: true,
    alwaysOnTop: true,
    hasShadow: false,
    minWidth: 220,
    minHeight: 48,
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  taskbarWidgetWindow.setAlwaysOnTop(true, 'screen-saver');
  taskbarWidgetWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  taskbarWidgetWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(getTaskbarWidgetHtml())}`);
  taskbarWidgetWindow.once('ready-to-show', () => {
    updateTaskbarWidget();
    taskbarWidgetWindow?.showInactive();
  });
  taskbarWidgetWindow.on('closed', () => {
    taskbarWidgetWindow = null;
  });
  taskbarWidgetWindow.on('move', saveTaskbarWidgetBounds);
  taskbarWidgetWindow.on('resize', saveTaskbarWidgetBounds);
}

function destroyTaskbarWidget() {
  if (!taskbarWidgetWindow) {
    return;
  }

  saveTaskbarWidgetBounds();
  const target = taskbarWidgetWindow;
  taskbarWidgetWindow = null;
  target.close();
}

function updateTaskbarWidget() {
  if (!configCache.enableTaskbarWidget) {
    destroyTaskbarWidget();
    return;
  }

  createTaskbarWidget();
  if (!taskbarWidgetWindow) {
    return;
  }

  const text = trayMetricsText || 'Нет выбранных показателей';
  taskbarWidgetWindow.webContents.executeJavaScript(
    `document.getElementById('metrics').textContent = ${JSON.stringify(text.replaceAll('\n', '   '))};`,
    true
  ).catch(() => {});
}

function showMainWindow() {
  if (!mainWindow) {
    return;
  }

  mainWindow.show();
  mainWindow.focus();
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1180,
    height: 820,
    minWidth: 920,
    minHeight: 640,
    backgroundColor: '#0f1118',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

  mainWindow.on('close', (event) => {
    if (!isQuitting && configCache.runInTray) {
      event.preventDefault();
      mainWindow.hide();
    }
  });
}

async function requireToken() {
  const token = await getAccessToken();
  if (!token) {
    const error = new Error('OAuth-токен не задан');
    error.code = 'NO_TOKEN';
    throw error;
  }
  return token;
}

async function apiRequest(resource, options = {}) {
  const token = await requireToken();
  const response = await fetch(`${API_BASE_URL}${resource}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers
    }
  });

  let payload = null;
  const text = await response.text();

  if (text) {
    try {
      payload = JSON.parse(text);
    } catch (error) {
      payload = { status: 'error', message: text };
    }
  }

  if (!response.ok) {
    const error = new Error(payload?.message || `Yandex API HTTP ${response.status}`);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

async function getAppState() {
  await loadConfig();

  return {
    config: {
      oauthConfigured: Boolean(getYandexOAuthClientId()),
      oauthRedirectUri: getRedirectUri(),
      oauthScope: OAUTH_SCOPES,
      runInTray: configCache.runInTray,
      launchAtLogin: configCache.launchAtLogin,
      pollIntervalSec: configCache.pollIntervalSec,
      enableTaskbarWidget: configCache.enableTaskbarWidget,
      theme: configCache.theme,
      tilesAutoExpanded: configCache.tilesAutoExpanded,
      taskbarWidgetBounds: configCache.taskbarWidgetBounds,
      tileLayout: configCache.tileLayout,
      tileOrder: configCache.tileOrder,
      pinnedMetrics: configCache.pinnedMetrics,
      tokenEncrypted: Boolean(configCache.encryptedToken || configCache.encryptedAuth),
      hasToken: Boolean(getAuthData()?.access_token || getLegacyToken())
    }
  };
}

function applyLaunchAtLogin(enabled) {
  app.setLoginItemSettings({
    openAtLogin: enabled,
    openAsHidden: true
  });
}

ipcMain.handle('app:get-state', () => getAppState());

ipcMain.handle('app:update-config', async (event, patch) => {
  const nextConfig = { ...configCache, ...patch };

  if (Object.prototype.hasOwnProperty.call(patch, 'launchAtLogin')) {
    applyLaunchAtLogin(Boolean(patch.launchAtLogin));
  }

  await saveConfig(nextConfig);
  updateTrayMenu();
  updateTaskbarWidget();
  return getAppState();
});

ipcMain.handle('app:open-external', async (event, url) => {
  await shell.openExternal(String(url));
  return { ok: true };
});

ipcMain.handle('app:update-tray-metrics', async (event, metricsText) => {
  trayMetricsText = String(metricsText || '').slice(0, 900);
  updateTrayMenu();
  updateTaskbarWidget();
  return { ok: true };
});

ipcMain.handle('auth:set-token', async (event, token) => setToken(token));

ipcMain.handle('auth:clear-token', async () => setToken(''));

ipcMain.handle('auth:start-login', async () => {
  try {
    return await startOAuthLogin();
  } catch (error) {
    return {
      ok: false,
      code: error.code || 'OAUTH_START_FAILED',
      message: error.message || 'Failed to start Yandex OAuth login.',
      redirectUri: getRedirectUri(),
      scope: OAUTH_SCOPES
    };
  }
});

ipcMain.handle('auth:open-oauth-console', async () => {
  await shell.openExternal('https://oauth.yandex.ru/client/new');
  return { ok: true };
});

ipcMain.handle('home:get-info', async () => apiRequest('/user/info'));

ipcMain.handle('home:get-device', async (event, deviceId) => {
  return apiRequest(`/devices/${encodeURIComponent(deviceId)}`);
});

ipcMain.handle('home:device-action', async (event, deviceId, actions) => {
  return apiRequest('/devices/actions', {
    method: 'POST',
    body: JSON.stringify({
      devices: [
        {
          id: deviceId,
          actions
        }
      ]
    })
  });
});

ipcMain.handle('home:group-action', async (event, groupId, actions) => {
  return apiRequest(`/groups/${encodeURIComponent(groupId)}/actions`, {
    method: 'POST',
    body: JSON.stringify({ actions })
  });
});

ipcMain.handle('home:scenario-action', async (event, scenarioId) => {
  return apiRequest(`/scenarios/${encodeURIComponent(scenarioId)}/actions`, {
    method: 'POST'
  });
});

app.whenReady().then(async () => {
  await loadConfig();
  applyLaunchAtLogin(Boolean(configCache.launchAtLogin));
  createMainWindow();
  createTray();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
    showMainWindow();
  });
});

app.on('before-quit', () => {
  isQuitting = true;
  stopOAuthServer();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin' && !configCache.runInTray) {
    app.quit();
  }
});
