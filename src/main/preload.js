const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('smartHome', {
  getState: () => ipcRenderer.invoke('app:get-state'),
  updateConfig: (patch) => ipcRenderer.invoke('app:update-config', patch),
  openExternal: (url) => ipcRenderer.invoke('app:open-external', url),
  updateTrayMetrics: (metricsText) => ipcRenderer.invoke('app:update-tray-metrics', metricsText),
  setToken: (token) => ipcRenderer.invoke('auth:set-token', token),
  clearToken: () => ipcRenderer.invoke('auth:clear-token'),
  startOAuthLogin: (clientId) => ipcRenderer.invoke('auth:start-login', clientId),
  openOAuthConsole: () => ipcRenderer.invoke('auth:open-oauth-console'),
  getHomeInfo: () => ipcRenderer.invoke('home:get-info'),
  getDevice: (deviceId) => ipcRenderer.invoke('home:get-device', deviceId),
  deviceAction: (deviceId, actions) => ipcRenderer.invoke('home:device-action', deviceId, actions),
  groupAction: (groupId, actions) => ipcRenderer.invoke('home:group-action', groupId, actions),
  scenarioAction: (scenarioId) => ipcRenderer.invoke('home:scenario-action', scenarioId),
  onRefreshRequested: (callback) => {
    const listener = () => callback();
    ipcRenderer.on('home:refresh-requested', listener);
    return () => ipcRenderer.removeListener('home:refresh-requested', listener);
  },
  onLoginComplete: (callback) => {
    const listener = (event, payload) => callback(payload);
    ipcRenderer.on('auth:login-complete', listener);
    return () => ipcRenderer.removeListener('auth:login-complete', listener);
  }
});
