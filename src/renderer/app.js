const DEFAULT_TILE_LAYOUT = { cols: 1, rows: 2 };
const LEGACY_TILE_LAYOUTS = {
  s: { cols: 1, rows: 2 },
  m: { cols: 1, rows: 2 },
  l: { cols: 2, rows: 3 },
  xl: { cols: 3, rows: 3 }
};
const MIN_TILE_COLS = 1;
const MAX_TILE_COLS = 3;
const MIN_TILE_ROWS = 2;
const MAX_TILE_ROWS = 5;
const TILE_BASE_WIDTH = 224;
const TILE_BASE_HEIGHT = 64;
const TILE_GAP = 8;
const MIN_TILE_WIDTH = 198;
const MAX_TILE_WIDTH = 720;
const MIN_TILE_HEIGHT = 182;
const MAX_TILE_HEIGHT = 440;
const TILE_MIN_CONTENT_HEIGHT = 178;
const TILE_PROPERTY_ROW_HEIGHT = 28;
const TILE_CONTROL_ROW_HEIGHT = 46;

const demoHome = {
  status: 'ok',
  request_id: 'demo',
  households: [{ id: 'home', name: 'Мой дом' }],
  rooms: [
    { id: 'living', name: 'Гостиная', household_id: 'home', devices: ['lamp-1', 'speaker-1', 'purifier-1'] },
    { id: 'bedroom', name: 'Спальня', household_id: 'home', devices: ['conditioner-1', 'humidifier-1'] },
    { id: 'office', name: 'Офис', household_id: 'home', devices: ['socket-1'] }
  ],
  groups: [],
  scenarios: [
    { id: 'night', name: 'Ночной режим', is_active: true },
    { id: 'away', name: 'Никого нет дома', is_active: true }
  ],
  devices: [
    {
      id: 'lamp-1',
      name: 'Настольная лампа',
      type: 'devices.types.light',
      room: 'living',
      state: 'online',
      capabilities: [
        { type: 'devices.capabilities.on_off', state: { instance: 'on', value: true }, parameters: { split: false } },
        { type: 'devices.capabilities.range', state: { instance: 'brightness', value: 72 }, parameters: { instance: 'brightness', range: { min: 1, max: 100, precision: 1 }, unit: 'unit.percent' } },
        { type: 'devices.capabilities.color_setting', state: { instance: 'temperature_k', value: 4200 }, parameters: { temperature_k: { min: 2700, max: 6500 } } }
      ],
      properties: []
    },
    {
      id: 'conditioner-1',
      name: 'Кондиционер',
      type: 'devices.types.thermostat.ac',
      room: 'bedroom',
      state: 'online',
      capabilities: [
        { type: 'devices.capabilities.on_off', state: { instance: 'on', value: false }, parameters: { split: false } },
        { type: 'devices.capabilities.range', state: { instance: 'temperature', value: 25 }, parameters: { instance: 'temperature', range: { min: 16, max: 30, precision: 1 }, unit: 'unit.temperature.celsius' } },
        {
          type: 'devices.capabilities.mode',
          state: { instance: 'thermostat', value: 'cool' },
          parameters: {
            instance: 'thermostat',
            modes: [
              { value: 'cool' },
              { value: 'heat' },
              { value: 'fan_only' },
              { value: 'auto' }
            ]
          }
        }
      ],
      properties: [
        { type: 'devices.properties.float', state: { instance: 'temperature', value: 24.5 }, parameters: { instance: 'temperature', unit: 'unit.temperature.celsius' } },
        { type: 'devices.properties.float', state: { instance: 'humidity', value: 56 }, parameters: { instance: 'humidity', unit: 'unit.percent' } }
      ]
    },
    {
      id: 'speaker-1',
      name: 'Станция Макс',
      type: 'devices.types.media_device',
      room: 'living',
      state: 'online',
      capabilities: [
        { type: 'devices.capabilities.on_off', state: { instance: 'on', value: true }, parameters: { split: false } },
        { type: 'devices.capabilities.range', state: { instance: 'volume', value: 35 }, parameters: { instance: 'volume', range: { min: 0, max: 100, precision: 1 }, unit: 'unit.percent' } }
      ],
      properties: []
    },
    {
      id: 'purifier-1',
      name: 'Очиститель',
      type: 'devices.types.purifier',
      room: 'living',
      state: 'online',
      capabilities: [
        { type: 'devices.capabilities.on_off', state: { instance: 'on', value: true }, parameters: { split: false } },
        { type: 'devices.capabilities.range', state: { instance: 'fan_speed', value: 2 }, parameters: { instance: 'fan_speed', range: { min: 1, max: 4, precision: 1 } } }
      ],
      properties: [
        { type: 'devices.properties.float', state: { instance: 'pm2.5_density', value: 12 }, parameters: { instance: 'pm2.5_density', unit: 'unit.density.mcg_m3' } }
      ]
    },
    {
      id: 'humidifier-1',
      name: 'Увлажнитель',
      type: 'devices.types.humidifier',
      room: 'bedroom',
      state: 'offline',
      capabilities: [
        { type: 'devices.capabilities.on_off', state: { instance: 'on', value: false }, parameters: { split: false } }
      ],
      properties: [
        { type: 'devices.properties.float', state: { instance: 'humidity', value: 48 }, parameters: { instance: 'humidity', unit: 'unit.percent' } }
      ]
    },
    {
      id: 'socket-1',
      name: 'Розетка',
      type: 'devices.types.openable',
      room: 'office',
      state: 'online',
      capabilities: [
        { type: 'devices.capabilities.on_off', state: { instance: 'on', value: false }, parameters: { split: false } }
      ],
      properties: []
    }
  ]
};

const state = {
  home: demoHome,
  config: {
    runInTray: true,
    launchAtLogin: false,
    pollIntervalSec: 30,
    oauthConfigured: false,
    oauthRedirectUri: '',
    oauthScope: 'iot:view iot:control',
    tileLayout: {},
    pinnedMetrics: [],
    enableTaskbarWidget: false,
    hasToken: false
  },
  filter: 'all',
  search: '',
  isDemo: true,
  activeDeviceId: null,
  activeMetric: null,
  detailedDevices: {},
  historyRange: 'day',
  metricHistory: loadMetricHistory(),
  refreshTimer: null
};

const elements = {
  connectionStatus: document.querySelector('#connectionStatus'),
  homeSummary: document.querySelector('#homeSummary'),
  roomList: document.querySelector('#roomList'),
  quickStats: document.querySelector('#quickStats'),
  tabs: document.querySelector('#tabs'),
  tileGrid: document.querySelector('#tileGrid'),
  searchInput: document.querySelector('#searchInput'),
  refreshButton: document.querySelector('#refreshButton'),
  settingsButton: document.querySelector('#settingsButton'),
  settingsDialog: document.querySelector('#settingsDialog'),
  loginButton: document.querySelector('#loginButton'),
  clearTokenButton: document.querySelector('#clearTokenButton'),
  runInTrayInput: document.querySelector('#runInTrayInput'),
  launchAtLoginInput: document.querySelector('#launchAtLoginInput'),
  taskbarWidgetInput: document.querySelector('#taskbarWidgetInput'),
  deviceDialog: document.querySelector('#deviceDialog'),
  closeDeviceDialog: document.querySelector('#closeDeviceDialog'),
  detailIcon: document.querySelector('#detailIcon'),
  detailRoom: document.querySelector('#detailRoom'),
  detailName: document.querySelector('#detailName'),
  detailMeta: document.querySelector('#detailMeta'),
  detailControls: document.querySelector('#detailControls'),
  detailProperties: document.querySelector('#detailProperties'),
  detailCapabilities: document.querySelector('#detailCapabilities'),
  historyDialog: document.querySelector('#historyDialog'),
  closeHistoryDialog: document.querySelector('#closeHistoryDialog'),
  pinHistoryMetric: document.querySelector('#pinHistoryMetric'),
  historyTitle: document.querySelector('#historyTitle'),
  historySubtitle: document.querySelector('#historySubtitle'),
  historyRanges: document.querySelector('#historyRanges'),
  historyChart: document.querySelector('#historyChart'),
  deviceTileTemplate: document.querySelector('#deviceTileTemplate')
};

const iconMap = {
  light: '<svg viewBox="0 0 80 80" fill="none"><defs><linearGradient id="g1" x1="20" y1="8" x2="58" y2="70"><stop stop-color="#fffbe6"/><stop offset="1" stop-color="#cfd5dc"/></linearGradient></defs><ellipse cx="40" cy="24" rx="17" ry="20" fill="url(#g1)"/><path d="M29 44h22l-3 19H32l-3-19Z" fill="#d8dde3"/><path d="M31 55h18M33 62h14" stroke="#9ca4ad" stroke-width="3" stroke-linecap="round"/></svg>',
  thermostat: '<svg viewBox="0 0 80 80" fill="none"><defs><linearGradient id="g2" x1="16" y1="16" x2="66" y2="66"><stop stop-color="#fff"/><stop offset="1" stop-color="#ccd1d6"/></linearGradient></defs><rect x="15" y="22" width="50" height="36" rx="9" fill="url(#g2)"/><path d="M28 35h25M25 42h20" stroke="#9ca4ad" stroke-width="3" stroke-linecap="round"/><path d="M49 29c7 2 12 7 14 14" stroke="#8f72ff" stroke-width="3" stroke-linecap="round"/></svg>',
  purifier: '<svg viewBox="0 0 80 80" fill="none"><defs><linearGradient id="g3" x1="20" y1="8" x2="60" y2="70"><stop stop-color="#fff"/><stop offset="1" stop-color="#c8ced4"/></linearGradient></defs><rect x="25" y="10" width="30" height="60" rx="9" fill="url(#g3)"/><path d="M51 21c-10 2-17 2-24 0" stroke="#8f72ff" stroke-width="3"/><path d="M49 30v27" stroke="#98a0aa" stroke-width="3" stroke-linecap="round"/><path d="M31 60h8" stroke="#98a0aa" stroke-width="3" stroke-linecap="round"/></svg>',
  media: '<svg viewBox="0 0 80 80" fill="none"><defs><linearGradient id="g4" x1="20" y1="12" x2="62" y2="70"><stop stop-color="#394055"/><stop offset="1" stop-color="#151824"/></linearGradient></defs><rect x="24" y="10" width="32" height="60" rx="7" fill="url(#g4)"/><path d="M29 18h22" stroke="#7b4dff" stroke-width="3" stroke-linecap="round"/><circle cx="40" cy="50" r="9" fill="#242a3a"/><circle cx="40" cy="50" r="4" fill="#7b4dff"/></svg>',
  socket: '<svg viewBox="0 0 80 80" fill="none"><defs><linearGradient id="g5" x1="18" y1="12" x2="60" y2="68"><stop stop-color="#fff"/><stop offset="1" stop-color="#cbd0d5"/></linearGradient></defs><path d="M25 17h30l8 12v34H20V29l5-12Z" fill="url(#g5)"/><path d="M33 38v10M47 38v10M32 57h16" stroke="#9ca4ad" stroke-width="4" stroke-linecap="round"/></svg>',
  default: '<svg viewBox="0 0 80 80" fill="none"><defs><linearGradient id="g6" x1="16" y1="14" x2="64" y2="66"><stop stop-color="#fff"/><stop offset="1" stop-color="#cbd0d5"/></linearGradient></defs><rect x="18" y="18" width="44" height="44" rx="10" fill="url(#g6)"/><path d="M30 40h20M40 30v20" stroke="#9ca4ad" stroke-width="4" stroke-linecap="round"/></svg>'
};

const DEVICE_TYPE_IMAGE_TYPES = new Set([
  'devices.types.camera',
  'devices.types.cooking',
  'devices.types.cooking.coffee_maker',
  'devices.types.cooking.kettle',
  'devices.types.cooking.multicooker',
  'devices.types.dishwasher',
  'devices.types.humidifier',
  'devices.types.iron',
  'devices.types.light',
  'devices.types.light.lamp',
  'devices.types.light.ceiling',
  'devices.types.light.strip',
  'devices.types.media_device',
  'devices.types.media_device.receiver',
  'devices.types.media_device.tv',
  'devices.types.media_device.tv_box',
  'devices.types.openable',
  'devices.types.openable.curtain',
  'devices.types.openable.valve',
  'devices.types.other',
  'devices.types.pet_drinking_fountain',
  'devices.types.pet_feeder',
  'devices.types.purifier',
  'devices.types.sensor',
  'devices.types.sensor.button',
  'devices.types.sensor.climate',
  'devices.types.sensor.gas',
  'devices.types.sensor.illumination',
  'devices.types.sensor.motion',
  'devices.types.sensor.open',
  'devices.types.sensor.smoke',
  'devices.types.sensor.vibration',
  'devices.types.sensor.water_leak',
  'devices.types.smart_meter',
  'devices.types.smart_meter.cold_water',
  'devices.types.smart_meter.electricity',
  'devices.types.smart_meter.gas',
  'devices.types.smart_meter.heat',
  'devices.types.smart_meter.hot_water',
  'devices.types.socket',
  'devices.types.switch',
  'devices.types.switch.relay',
  'devices.types.thermostat',
  'devices.types.thermostat.ac',
  'devices.types.vacuum_cleaner',
  'devices.types.ventilation',
  'devices.types.ventilation.fan',
  'devices.types.washing_machine'
]);

function getDeviceTypeImage(type = '') {
  const parts = type.split('.');
  for (let index = parts.length; index >= 3; index -= 1) {
    const candidate = parts.slice(0, index).join('.');
    if (DEVICE_TYPE_IMAGE_TYPES.has(candidate)) {
      return `../assets/device-types/${candidate}.png`;
    }
  }
  return null;
}

function getDeviceIcon(type = '') {
  const imagePath = getDeviceTypeImage(type);
  if (imagePath) {
    return `<img src="${imagePath}" alt="">`;
  }

  if (type.includes('light')) return iconMap.light;
  if (type.includes('thermostat') || type.includes('climate')) return iconMap.thermostat;
  if (type.includes('purifier') || type.includes('humidifier')) return iconMap.purifier;
  if (type.includes('media')) return iconMap.media;
  if (type.includes('socket') || type.includes('openable')) return iconMap.socket;
  return iconMap.default;
}

function localizeDeviceType(type = '') {
  const names = {
    'devices.types.light': 'Свет',
    'devices.types.light.lamp': 'Лампа',
    'devices.types.light.ceiling': 'Люстра',
    'devices.types.light.strip': 'Лента',
    'devices.types.socket': 'Розетка',
    'devices.types.switch': 'Выключатель',
    'devices.types.switch.relay': 'Реле',
    'devices.types.thermostat': 'Термостат',
    'devices.types.thermostat.ac': 'Кондиционер',
    'devices.types.humidifier': 'Увлажнитель',
    'devices.types.purifier': 'Очиститель воздуха',
    'devices.types.vacuum_cleaner': 'Пылесос',
    'devices.types.media_device': 'Медиаустройство',
    'devices.types.media_device.tv': 'Телевизор',
    'devices.types.media_device.tv_box': 'Приставка',
    'devices.types.media_device.receiver': 'Ресивер',
    'devices.types.camera': 'Камера',
    'devices.types.sensor': 'Датчик',
    'devices.types.openable': 'Открываемое устройство',
    'devices.types.openable.curtain': 'Шторы',
    'devices.types.openable.valve': 'Клапан'
  };
  return names[type] || type.replace('devices.types.', '').replaceAll('_', ' ');
}

function getRoomName(roomId) {
  return state.home.rooms.find((room) => room.id === roomId)?.name || 'Без комнаты';
}

function getOnOffCapability(device) {
  return device.capabilities?.find((capability) => capability.type === 'devices.capabilities.on_off');
}

function isDeviceOn(device) {
  return Boolean(getOnOffCapability(device)?.state?.value);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function formatNumber(value, options = {}) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return String(value);
  }

  const maximumFractionDigits = options.maximumFractionDigits ?? 2;
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits
  }).format(numeric);
}

function loadMetricHistory() {
  try {
    const raw = window.localStorage.getItem('metricHistory:v1');
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (error) {
    return {};
  }
}

function saveMetricHistory() {
  try {
    window.localStorage.setItem('metricHistory:v1', JSON.stringify(state.metricHistory));
  } catch (error) {
    // Local history is a convenience feature. If storage is unavailable, the UI still works.
  }
}

function getMetricKey(deviceId, instance) {
  return `${deviceId}:${instance}`;
}

function parseMetricKey(metricKey) {
  const separator = String(metricKey).indexOf(':');
  if (separator === -1) {
    return { deviceId: metricKey, instance: '' };
  }

  return {
    deviceId: metricKey.slice(0, separator),
    instance: metricKey.slice(separator + 1)
  };
}

function getPropertyInstance(property) {
  return property?.state?.instance || property?.parameters?.instance || '';
}

function getPropertyNumericValue(property) {
  const value = property?.state?.value;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function recordMetricHistory() {
  const now = Date.now();
  const monthAgo = now - 31 * 24 * 60 * 60 * 1000;
  let changed = false;

  (state.home.devices || []).forEach((device) => {
    (device.properties || []).forEach((property) => {
      const instance = getPropertyInstance(property);
      const value = getPropertyNumericValue(property);
      if (!instance || value === null) {
        return;
      }

      const key = getMetricKey(device.id, instance);
      const points = state.metricHistory[key] || [];
      const last = points.at(-1);
      if (last && now - last.t < 4000 && last.v === value) {
        return;
      }

      state.metricHistory[key] = [...points, { t: now, v: value }]
        .filter((point) => point.t >= monthAgo)
        .slice(-1200);
      changed = true;
    });
  });

  if (changed) {
    saveMetricHistory();
  }
}

function normalizeTileLayout(layout) {
  if (typeof layout === 'string') {
    return LEGACY_TILE_LAYOUTS[layout] || DEFAULT_TILE_LAYOUT;
  }

  if (!layout || typeof layout !== 'object') {
    layout = DEFAULT_TILE_LAYOUT;
  }

  const cols = clamp(Number(layout.cols) || DEFAULT_TILE_LAYOUT.cols, MIN_TILE_COLS, MAX_TILE_COLS);
  const rows = clamp(Number(layout.rows) || DEFAULT_TILE_LAYOUT.rows, MIN_TILE_ROWS, MAX_TILE_ROWS);
  const width = clamp(
    Number(layout.width) || (cols * TILE_BASE_WIDTH + (cols - 1) * TILE_GAP),
    MIN_TILE_WIDTH,
    MAX_TILE_WIDTH
  );
  const height = clamp(
    Number(layout.height) || (rows * TILE_BASE_HEIGHT + (rows - 1) * TILE_GAP),
    MIN_TILE_HEIGHT,
    MAX_TILE_HEIGHT
  );

  return {
    cols: clamp(Math.round((width + TILE_GAP) / (TILE_BASE_WIDTH + TILE_GAP)), MIN_TILE_COLS, MAX_TILE_COLS),
    rows: clamp(Math.round((height + TILE_GAP) / (TILE_BASE_HEIGHT + TILE_GAP)), MIN_TILE_ROWS, MAX_TILE_ROWS),
    width,
    height
  };
}

function getTileLayout(id) {
  return normalizeTileLayout(state.config.tileLayout[id]);
}

function setTileLayout(id, layout) {
  const nextLayout = normalizeTileLayout(layout);
  state.config.tileLayout = { ...state.config.tileLayout, [id]: nextLayout };
  window.smartHome?.updateConfig({ tileLayout: state.config.tileLayout });
}

function getMaxGridColumns() {
  if (!elements.tileGrid) {
    return MAX_TILE_COLS;
  }

  const width = elements.tileGrid.clientWidth || window.innerWidth || 1;
  return clamp(Math.floor((width + 8) / 218), 1, MAX_TILE_COLS);
}

function applyTileLayout(node, layout) {
  const normalized = normalizeTileLayout(layout);
  node.style.width = `${normalized.width}px`;
  node.style.height = `${normalized.height}px`;
  node.style.gridColumn = '';
  node.style.gridRow = '';
  node.dataset.cols = String(normalized.cols);
  node.dataset.rows = String(normalized.rows);
  node.dataset.width = String(normalized.width);
  node.dataset.height = String(normalized.height);
  node.dataset.info = getTileInfoLevel(normalized);
}

function getTileInfoLevel(layout) {
  const area = layout.cols * layout.rows;
  if (area <= 2) return 'minimal';
  if (area <= 4) return 'compact';
  if (area <= 6) return 'medium';
  return 'full';
}

function getTilePropertyColumnCount(layout) {
  return Number(layout.width) >= 270 ? 2 : 1;
}

function getTilePropertyCount(device) {
  if (!device) {
    return 0;
  }

  return (device.properties || []).filter((property) => getPropertyDisplayValue(property)).length;
}

function getTileControlCount(device) {
  if (!device) {
    return 0;
  }

  return (device.capabilities || []).reduce((count, capability) => {
    if (capability.type === 'devices.capabilities.on_off' || (!capability.state && !capability.parameters)) {
      return count;
    }

    if (capability.type === 'devices.capabilities.color_setting') {
      const parameters = capability.parameters || {};
      const colorCount = parameters.color_model || capability.state?.instance === 'rgb' || capability.state?.instance === 'hsv' ? 1 : 0;
      const temperatureCount = parameters.temperature_k || capability.state?.instance === 'temperature_k' ? 1 : 0;
      const sceneCount = parameters.color_scene ? 1 : 0;
      return count + Math.max(1, colorCount + temperatureCount + sceneCount);
    }

    return count + 1;
  }, 0);
}

function getTilePropertyLimit(layout, device = null) {
  const propertyCount = getTilePropertyCount(device);
  if (!propertyCount) {
    return 0;
  }

  const controlLimit = getTileControlLimit(layout, device);
  const controlRows = controlLimit > 0 ? Math.ceil(controlLimit / 2) : 0;
  const availableHeight = Number(layout.height) - TILE_MIN_CONTENT_HEIGHT - controlRows * TILE_CONTROL_ROW_HEIGHT;
  const propertyRows = Math.max(0, Math.floor(availableHeight / TILE_PROPERTY_ROW_HEIGHT));
  return Math.min(propertyCount, propertyRows * getTilePropertyColumnCount(layout));
}

function getTileControlLimit(layout, device = null) {
  const controlCount = getTileControlCount(device);
  if (!controlCount || Number(layout.height) < 220) {
    return 0;
  }

  const propertyCount = getTilePropertyCount(device);
  const columns = getTilePropertyColumnCount(layout);
  const displayedPropertyRows = Math.ceil(Math.min(propertyCount, columns * 2) / columns);
  const availableHeight = Number(layout.height) - TILE_MIN_CONTENT_HEIGHT - displayedPropertyRows * TILE_PROPERTY_ROW_HEIGHT;
  const controlRows = Math.max(0, Math.floor(availableHeight / TILE_CONTROL_ROW_HEIGHT));
  return Math.min(controlCount, controlRows * 2);
}

function hasVisibleTileControls(device, layout) {
  if (!device) {
    return false;
  }

  const limit = getTileControlLimit(layout, device);
  if (limit <= 0) {
    return false;
  }

  return (device.capabilities || []).some((capability) => {
    return capability.type !== 'devices.capabilities.on_off' && (capability.state || capability.parameters);
  });
}

function getTileResizeLimits(device = null) {
  if (!device) {
    return {
      minWidth: MIN_TILE_WIDTH,
      minHeight: MIN_TILE_HEIGHT,
      maxWidth: MAX_TILE_WIDTH,
      maxHeight: MAX_TILE_HEIGHT
    };
  }

  const propertyCount = getTilePropertyCount(device);
  const controlCount = getTileControlCount(device);
  const propertyRows = Math.ceil(propertyCount / 2);
  const controlRows = Math.ceil(controlCount / 2);
  const usefulWidth = propertyCount > 1 || controlCount > 1 ? 480 : 240;
  const usefulHeight = TILE_MIN_CONTENT_HEIGHT
    + propertyRows * TILE_PROPERTY_ROW_HEIGHT
    + controlRows * TILE_CONTROL_ROW_HEIGHT
    + (propertyCount || controlCount ? 10 : 0);

  return {
    minWidth: MIN_TILE_WIDTH,
    minHeight: MIN_TILE_HEIGHT,
    maxWidth: clamp(usefulWidth, MIN_TILE_WIDTH, MAX_TILE_WIDTH),
    maxHeight: clamp(usefulHeight, MIN_TILE_HEIGHT, MAX_TILE_HEIGHT)
  };
}

function clampTileLayoutToLimits(layout, limits) {
  return {
    ...layout,
    width: clamp(Number(layout.width), limits.minWidth, limits.maxWidth),
    height: clamp(Number(layout.height), limits.minHeight, limits.maxHeight)
  };
}

function localizeInstance(instance = '') {
  const names = {
    on: 'Питание',
    brightness: 'Яркость',
    volume: 'Громкость',
    temperature: 'Температура',
    target_temperature: 'Целевая температура',
    open: 'Открытие',
    channel: 'Канал',
    fan_speed: 'Скорость',
    humidity: 'Влажность',
    pressure: 'Давление',
    pm2_5_density: 'PM2.5',
    'pm2.5_density': 'PM2.5',
    pm10_density: 'PM10',
    power: 'Мощность',
    voltage: 'Напряжение',
    amperage: 'Ток',
    battery_level: 'Батарея',
    thermostat: 'Режим',
    temperature_k: 'Температура цвета',
    rgb: 'Цвет',
    hsv: 'Цвет',
    scene: 'Сцена',
    backlight: 'Подсветка',
    controls_locked: 'Блокировка управления',
    ionization: 'Ионизация',
    mute: 'Без звука',
    oscillation: 'Поворот',
    pause: 'Пауза'
  };
  return names[instance] || instance.replaceAll('_', ' ');
}

function localizeValue(value = '') {
  const values = {
    cool: 'Охлаждение',
    heat: 'Нагрев',
    fan_only: 'Вентиляция',
    dry: 'Осушение',
    auto: 'Авто',
    low: 'Низкая',
    medium: 'Средняя',
    high: 'Высокая'
  };
  return values[value] || String(value).replaceAll('_', ' ');
}

function hsvToRgbInt(hsv = {}) {
  const h = Number(hsv.h || 0) / 60;
  const s = Number(hsv.s || 0) / 100;
  const v = Number(hsv.v || 0) / 100;
  const c = v * s;
  const x = c * (1 - Math.abs((h % 2) - 1));
  const m = v - c;
  const channels = h < 1 ? [c, x, 0] : h < 2 ? [x, c, 0] : h < 3 ? [0, c, x] : h < 4 ? [0, x, c] : h < 5 ? [x, 0, c] : [c, 0, x];
  const [r, g, b] = channels.map((channel) => Math.round((channel + m) * 255));
  return (r << 16) + (g << 8) + b;
}

function rgbIntToHex(value = 0) {
  return `#${Number(value).toString(16).padStart(6, '0').slice(-6)}`;
}

function hexToRgbInt(hex) {
  return Number.parseInt(String(hex).replace('#', ''), 16);
}

function rgbIntToHsv(value) {
  const r = ((value >> 16) & 255) / 255;
  const g = ((value >> 8) & 255) / 255;
  const b = (value & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  let h = 0;
  if (delta) {
    if (max === r) h = 60 * (((g - b) / delta) % 6);
    if (max === g) h = 60 * ((b - r) / delta + 2);
    if (max === b) h = 60 * ((r - g) / delta + 4);
  }
  if (h < 0) h += 360;
  return {
    h: Math.round(h),
    s: max === 0 ? 0 : Math.round((delta / max) * 100),
    v: Math.round(max * 100)
  };
}

function formatProperty(property) {
  const instance = property?.state?.instance || property?.parameters?.instance;
  const value = property?.state?.value;
  const unit = property?.parameters?.unit;

  if (value === undefined || value === null) {
    return null;
  }

  const displayValue = typeof value === 'number' ? formatNumber(value) : value;

  if (unit === 'unit.temperature.celsius') return `${localizeInstance(instance)} ${displayValue}°C`;
  if (unit === 'unit.percent') return `${localizeInstance(instance)} ${displayValue}%`;
  if (unit === 'unit.pressure.mmhg') return `${localizeInstance(instance)} ${displayValue} мм рт. ст.`;
  if (unit === 'unit.density.mcg_m3') return `${localizeInstance(instance)} ${displayValue} мкг/м³`;
  if (unit === 'unit.watt') return `${localizeInstance(instance)} ${displayValue} Вт`;
  if (unit === 'unit.volt') return `${localizeInstance(instance)} ${displayValue} В`;
  if (unit === 'unit.ampere') return `${localizeInstance(instance)} ${displayValue} А`;
  if (unit === 'unit.ppm') return `${localizeInstance(instance)} ${displayValue} ppm`;
  if (unit === 'unit.lux') return `${localizeInstance(instance)} ${displayValue} лк`;
  if (unit === 'unit.kilowatt_hour') return `${localizeInstance(instance)} ${displayValue} кВт⋅ч`;
  if (unit === 'unit.cubic_meter') return `${localizeInstance(instance)} ${displayValue} м³`;
  if (unit === 'unit.calorie') return `${localizeInstance(instance)} ${displayValue} кал`;
  return `${localizeInstance(instance)} ${displayValue}`;
}

function getPropertyIcon(instance = '') {
  const icons = {
    temperature: '♨',
    humidity: '●',
    pressure: '◉',
    pm2_5_density: 'PM',
    'pm2.5_density': 'PM',
    pm10_density: 'PM',
    power: '⚡',
    voltage: '⚡',
    amperage: '⚡',
    battery_level: '▮'
  };
  return icons[instance] || '•';
}

function getPropertyPriority(property) {
  const instance = property?.state?.instance || property?.parameters?.instance || '';
  const priorities = {
    temperature: 1,
    humidity: 2,
    co2_level: 3,
    pm2_5_density: 4,
    'pm2.5_density': 4,
    pm10_density: 5,
    illumination: 6,
    pressure: 7,
    battery_level: 8,
    power: 9,
    voltage: 10,
    amperage: 11
  };
  return priorities[instance] || 100;
}

function getPropertyDisplayValue(property) {
  const instance = property?.state?.instance || property?.parameters?.instance;
  const formatted = formatProperty(property);
  if (!formatted) return null;
  return formatted.replace(`${localizeInstance(instance)} `, '');
}

function findDeviceProperty(device, instances = []) {
  const allowed = new Set(instances);
  return (device.properties || []).find((property) => allowed.has(getPropertyInstance(property)));
}

function calculateSocketConsumption() {
  const sockets = (state.home.devices || []).filter((device) => String(device.name || '').trim() === 'Розетка');
  const totals = sockets.reduce((acc, device) => {
    const power = getPropertyNumericValue(findDeviceProperty(device, ['power']));
    const energy = getPropertyNumericValue(findDeviceProperty(device, [
      'electricity_meter',
      'electric_meter',
      'meter',
      'energy',
      'consumption'
    ]));

    if (power !== null) acc.power += power;
    if (energy !== null) acc.energy += energy;
    return acc;
  }, { power: 0, energy: 0 });

  return {
    count: sockets.length,
    power: totals.power,
    energy: totals.energy
  };
}

function getCapabilityName(capability) {
  const instance = capability?.state?.instance || capability?.parameters?.instance || '';
  const type = capability?.type || '';

  if (type === 'devices.capabilities.on_off') return 'Питание';
  if (type === 'devices.capabilities.color_setting') return 'Цвет и температура';
  if (type === 'devices.capabilities.range') return localizeInstance(instance);
  if (type === 'devices.capabilities.mode') return localizeInstance(instance);
  if (type === 'devices.capabilities.toggle') return localizeInstance(instance);
  return type.replace('devices.capabilities.', '');
}

function formatCapabilityState(capability) {
  const value = capability?.state?.value;
  const instance = capability?.state?.instance || capability?.parameters?.instance;

  if (value === undefined || value === null) {
    const modes = capability?.parameters?.modes;
    if (Array.isArray(modes)) {
      return `${modes.length} режимов`;
    }
    return 'доступно';
  }

  if (typeof value === 'boolean') {
    return value ? 'включено' : 'выключено';
  }

  const displayValue = typeof value === 'number' ? formatNumber(value) : value;
  if (instance === 'temperature') return `${displayValue} °C`;
  if (instance === 'brightness' || instance === 'volume') return `${displayValue}%`;
  return localizeValue(value);
}

function createDetailRow(name, value, icon = '•', options = {}) {
  const row = document.createElement('div');
  row.className = 'detail-row';
  row.dataset.icon = icon;
  if (options.clickable) {
    row.classList.add('clickable');
    row.tabIndex = 0;
  }

  const nameNode = document.createElement('div');
  nameNode.className = 'detail-row-name';
  nameNode.textContent = name;

  const valueNode = document.createElement('div');
  valueNode.className = 'detail-row-value';
  valueNode.textContent = value;

  row.append(nameNode, valueNode);
  if (options.onClick) {
    row.addEventListener('click', options.onClick);
    row.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        options.onClick(event);
      }
    });
  }
  if (options.onContextMenu) {
    row.addEventListener('contextmenu', options.onContextMenu);
    row.title = options.title || row.title;
  }
  return row;
}

function isMetricPinned(metricKey) {
  return (state.config.pinnedMetrics || []).includes(metricKey);
}

async function setMetricPinned(metricKey, pinned) {
  const current = new Set(state.config.pinnedMetrics || []);
  if (pinned) {
    current.add(metricKey);
  } else {
    current.delete(metricKey);
  }

  state.config.pinnedMetrics = [...current];
  await window.smartHome?.updateConfig({ pinnedMetrics: state.config.pinnedMetrics });
  syncWindowsPanelMetrics();
}

function toggleMetricPinned(metricKey) {
  return setMetricPinned(metricKey, !isMetricPinned(metricKey));
}

function getTrayMetricEntries() {
  const allMetrics = (state.home.devices || []).flatMap((device) => (device.properties || [])
    .map((property) => {
      const instance = getPropertyInstance(property);
      const value = getPropertyDisplayValue(property);
      return instance && value ? {
        key: getMetricKey(device.id, instance),
        text: `${device.name}: ${localizeInstance(instance)} ${value}`
      } : null;
    })
    .filter(Boolean));

  const pinned = state.config.pinnedMetrics || [];
  const selected = pinned.length
    ? pinned.map((key) => allMetrics.find((metric) => metric.key === key)).filter(Boolean)
    : allMetrics.slice(0, 4);

  return selected.slice(0, 8);
}

function syncWindowsPanelMetrics() {
  const lines = getTrayMetricEntries().map((metric) => metric.text);
  window.smartHome?.updateTrayMetrics(lines.join('\n'));
}

function findMetric(deviceId, instance) {
  const device = state.detailedDevices[deviceId] || findDeviceById(deviceId);
  const property = device?.properties?.find((item) => getPropertyInstance(item) === instance) || null;
  return device && property ? { device, property } : null;
}

function getHistoryRangeMs(range) {
  const ranges = {
    hour: 60 * 60 * 1000,
    day: 24 * 60 * 60 * 1000,
    week: 7 * 24 * 60 * 60 * 1000,
    month: 31 * 24 * 60 * 60 * 1000
  };
  return ranges[range] || ranges.day;
}

function formatHistoryTime(timestamp, range) {
  const options = range === 'hour'
    ? { hour: '2-digit', minute: '2-digit' }
    : { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' };
  return new Intl.DateTimeFormat('ru-RU', options).format(new Date(timestamp));
}

function getMetricUnit(property) {
  const unit = property?.parameters?.unit;
  const units = {
    'unit.temperature.celsius': '°C',
    'unit.percent': '%',
    'unit.pressure.mmhg': 'мм рт. ст.',
    'unit.density.mcg_m3': 'мкг/м³',
    'unit.watt': 'Вт',
    'unit.volt': 'В',
    'unit.ampere': 'А',
    'unit.ppm': 'ppm',
    'unit.lux': 'лк',
    'unit.kilowatt_hour': 'кВт⋅ч',
    'unit.cubic_meter': 'м³',
    'unit.calorie': 'кал'
  };
  return units[unit] || '';
}

function renderHistoryChart(points, property) {
  const svg = elements.historyChart;
  const width = 1000;
  const height = 430;
  const pad = { top: 30, right: 56, bottom: 44, left: 20 };
  const now = Date.now();
  const rangeMs = getHistoryRangeMs(state.historyRange);
  const start = now - rangeMs;
  const visiblePoints = points.filter((point) => point.t >= start);
  const currentValue = getPropertyNumericValue(property);
  const normalizedPoints = visiblePoints.length
    ? visiblePoints
    : (currentValue === null ? [] : [{ t: now - 1000, v: currentValue }, { t: now, v: currentValue }]);

  svg.replaceChildren();

  const grid = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  for (let index = 0; index < 4; index += 1) {
    const y = pad.top + ((height - pad.top - pad.bottom) / 3) * index;
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', '0');
    line.setAttribute('x2', String(width));
    line.setAttribute('y1', String(y));
    line.setAttribute('y2', String(y));
    line.setAttribute('class', 'history-grid-line');
    grid.append(line);
  }
  svg.append(grid);

  if (normalizedPoints.length === 0) {
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', String(width / 2));
    text.setAttribute('y', String(height / 2));
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('class', 'history-empty-text');
    text.textContent = 'История появится после обновлений';
    svg.append(text);
    return;
  }

  const minValue = Math.min(...normalizedPoints.map((point) => point.v));
  const maxValue = Math.max(...normalizedPoints.map((point) => point.v));
  const valueSpan = Math.max(1, maxValue - minValue);
  const xFor = (timestamp) => pad.left + ((timestamp - start) / rangeMs) * (width - pad.left - pad.right);
  const yFor = (value) => pad.top + (1 - ((value - minValue) / valueSpan)) * (height - pad.top - pad.bottom);
  const pathData = normalizedPoints
    .map((point, index) => `${index ? 'L' : 'M'} ${xFor(point.t).toFixed(1)} ${yFor(point.v).toFixed(1)}`)
    .join(' ');

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', pathData);
  path.setAttribute('class', 'history-line');
  svg.append(path);

  const last = normalizedPoints.at(-1);
  const marker = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  marker.setAttribute('cx', String(xFor(last.t)));
  marker.setAttribute('cy', String(yFor(last.v)));
  marker.setAttribute('r', '5');
  marker.setAttribute('class', 'history-marker');
  svg.append(marker);

  const unit = getMetricUnit(property);
  [minValue, minValue + valueSpan / 2, maxValue].forEach((value, index) => {
    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('x', String(width - 12));
    label.setAttribute('y', String(yFor(value) + 4));
    label.setAttribute('text-anchor', 'end');
    label.setAttribute('class', 'history-axis-label');
    label.textContent = `${formatNumber(value)}${index === 2 && unit ? ` ${unit}` : ''}`;
    svg.append(label);
  });

  const tooltip = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  tooltip.setAttribute('x', String(Math.max(120, Math.min(width - 160, xFor(last.t) - 78))));
  tooltip.setAttribute('y', String(Math.max(42, yFor(last.v) - 18)));
  tooltip.setAttribute('class', 'history-tooltip');
  tooltip.textContent = `${formatHistoryTime(last.t, state.historyRange)} · ${formatNumber(last.v)} ${unit}`;
  svg.append(tooltip);
}

function openMetricHistory(deviceId, instance) {
  const metric = findMetric(deviceId, instance);
  if (!metric) {
    return;
  }

  const key = getMetricKey(deviceId, instance);
  state.activeMetric = key;
  const value = getPropertyDisplayValue(metric.property);
  elements.historyTitle.textContent = `${localizeInstance(instance)} ${value || ''}`.trim();
  elements.historySubtitle.textContent = `${metric.device.name} · ${getRoomName(metric.device.room)} · ${new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date())}`;
  elements.historyRanges.querySelectorAll('button').forEach((button) => {
    button.classList.toggle('active', button.dataset.range === state.historyRange);
  });
  elements.pinHistoryMetric.classList.toggle('active', isMetricPinned(key));
  renderHistoryChart(state.metricHistory[key] || [], metric.property);
  if (!elements.historyDialog.open) {
    elements.historyDialog.showModal();
  }
}

function closeMetricHistory() {
  state.activeMetric = null;
  elements.historyDialog.close();
}

function renderRoomNavigation() {
  const roomEntries = [
    { id: 'all', name: 'Все', count: state.home.devices.length },
    ...state.home.rooms.map((room) => ({
      id: room.id,
      name: room.name,
      count: state.home.devices.filter((device) => device.room === room.id).length
    })),
    { id: 'scenarios', name: 'Сценарии', count: state.home.scenarios.length }
  ];

  elements.roomList.replaceChildren(
    ...roomEntries.map((entry) => {
      const button = document.createElement('button');
      button.className = `room-button ${state.filter === entry.id ? 'active' : ''}`;
      button.type = 'button';
      button.innerHTML = `<span>${entry.name}</span><span class="room-count">${entry.count}</span>`;
      button.addEventListener('click', () => {
        state.filter = entry.id;
        render();
      });
      return button;
    })
  );
}

function renderTabs() {
  const tabEntries = [
    { id: 'all', name: 'Все' },
    ...state.home.rooms.map((room) => ({ id: room.id, name: room.name })),
    { id: 'scenarios', name: 'Сценарии' }
  ];

  elements.tabs.replaceChildren(
    ...tabEntries.map((entry) => {
      const button = document.createElement('button');
      button.className = `tab-button ${state.filter === entry.id ? 'active' : ''}`;
      button.type = 'button';
      button.textContent = entry.name;
      button.addEventListener('click', () => {
        state.filter = entry.id;
        render();
      });
      return button;
    })
  );
}

function renderQuickStats() {
  const socketConsumption = calculateSocketConsumption();
  const roomCards = state.home.rooms
    .map((room) => {
      const roomDevices = state.home.devices.filter((device) => device.room === room.id);
      const properties = roomDevices.flatMap((device) => device.properties || []);
      const temp = properties.find((property) => property?.state?.instance === 'temperature');
      const humidity = properties.find((property) => property?.state?.instance === 'humidity');
      const pressure = properties.find((property) => property?.state?.instance === 'pressure');

      return {
        value: room.name,
        label: `${roomDevices.length} устр`,
        metrics: [
          temp && `♨ ${getPropertyDisplayValue(temp)}`,
          humidity && `● ${getPropertyDisplayValue(humidity)}`,
          pressure && `◉ ${getPropertyDisplayValue(pressure)}`
        ].filter(Boolean)
      };
    })
    .filter((card) => card.metrics.length || card.label);

  if (socketConsumption.count > 0) {
    roomCards.unshift({
      value: 'Розетки',
      label: `${socketConsumption.count} устр`,
      metrics: [
        `⚡ ${formatNumber(socketConsumption.power)} Вт`,
        socketConsumption.energy > 0 && `Σ ${formatNumber(socketConsumption.energy)} кВт⋅ч`
      ].filter(Boolean)
    });
  }

  const stats = roomCards.length
    ? roomCards
    : [
        { value: 'Мой дом', label: `${state.home.devices.length} устройств`, metrics: [`${state.home.devices.filter(isDeviceOn).length} вкл`] }
      ];

  elements.quickStats.replaceChildren(
    ...stats.map((stat) => {
      const card = document.createElement('article');
      card.className = 'stat-card';
      const metrics = (stat.metrics || [])
        .slice(0, 3)
        .map((metric) => `<span class="stat-metric">${metric}</span>`)
        .join('');
      card.innerHTML = `
        <div class="stat-value">${stat.value}</div>
        <div class="stat-label">${stat.label}</div>
        <div class="stat-metrics">${metrics}</div>
      `;
      return card;
    })
  );
}

function createDeviceAction(device, capability, nextState) {
  return window.smartHome.deviceAction(device.id, [
    {
      type: capability.type,
      state: nextState
    }
  ]);
}

async function runDeviceAction(device, capability, nextState) {
  if (state.isDemo) {
    capability.state = { ...capability.state, ...nextState };
    render();
    if (state.activeDeviceId === device.id && elements.deviceDialog.open) {
      await openDeviceDetails(device.id, { silent: true });
    }
    return;
  }

  await createDeviceAction(device, capability, nextState);
  await refreshHome();
  if (state.activeDeviceId === device.id && elements.deviceDialog.open) {
    await openDeviceDetails(device.id, { silent: true });
  }
}

function createOnOffControl(device, capability) {
  const button = document.createElement('button');
  const isOn = Boolean(capability.state?.value);
  button.type = 'button';
  button.className = `control-button ${isOn ? 'active' : ''}`;
  button.textContent = isOn ? 'Включено' : 'Выключено';
  button.title = isOn ? 'Выключить' : 'Включить';
  button.setAttribute('aria-label', button.title);
  button.addEventListener('click', () => {
    runDeviceAction(device, capability, {
      instance: capability.state?.instance || 'on',
      value: !isOn
    });
  });
  return button;
}

function createToggleControl(device, capability) {
  const button = document.createElement('button');
  const isOn = Boolean(capability.state?.value);
  const instance = capability.state?.instance || capability.parameters?.instance || 'toggle';
  button.type = 'button';
  button.className = `control-button ${isOn ? 'active' : ''}`;
  button.textContent = localizeInstance(instance);
  button.title = isOn ? 'Выключить' : 'Включить';
  button.setAttribute('aria-label', `${localizeInstance(instance)}: ${button.title}`);
  button.addEventListener('click', () => {
    runDeviceAction(device, capability, {
      instance,
      value: !isOn
    });
  });
  return button;
}

function createPowerSwitch(device) {
  const capability = getOnOffCapability(device);
  if (!capability) {
    return null;
  }

  const isOn = Boolean(capability.state?.value);
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `power-switch ${isOn ? 'active' : ''}`;
  button.setAttribute('aria-label', isOn ? 'Выключить' : 'Включить');
  button.innerHTML = '<span></span>';
  button.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    runDeviceAction(device, capability, {
      instance: capability.state?.instance || 'on',
      value: !isOn
    });
  });
  button.addEventListener('pointerdown', (event) => event.stopPropagation());
  return button;
}

function createRangeControl(device, capability) {
  const wrapper = document.createElement('div');
  wrapper.className = 'control-slider';
  const parameters = capability.parameters || {};
  const range = parameters.range || parameters.temperature_k || {};
  const instance = capability.state?.instance || parameters.instance || 'value';
  const value = Number(capability.state?.value ?? range.min ?? 0);
  const min = Number(range.min ?? 0);
  const max = Number(range.max ?? 100);
  const step = Number(range.precision ?? 1);
  const randomAccess = parameters.random_access !== false;

  if (!randomAccess) {
    wrapper.className = 'stepper-control';
    const title = document.createElement('span');
    title.textContent = localizeInstance(instance);
    const down = document.createElement('button');
    const up = document.createElement('button');
    down.type = 'button';
    up.type = 'button';
    down.className = 'control-button';
    up.className = 'control-button';
    down.textContent = '−';
    up.textContent = '+';
    down.addEventListener('click', () => runDeviceAction(device, capability, { instance, value: -step, relative: true }));
    up.addEventListener('click', () => runDeviceAction(device, capability, { instance, value: step, relative: true }));
    wrapper.append(title, down, up);
    return wrapper;
  }

  wrapper.innerHTML = `
    <label>
      <span>${localizeInstance(instance)}</span>
      <span>${value}</span>
    </label>
  `;

  const input = document.createElement('input');
  input.type = 'range';
  input.min = String(min);
  input.max = String(max);
  input.step = String(step);
  input.value = String(value);
  input.addEventListener('change', () => {
    runDeviceAction(device, capability, {
      instance,
      value: Number(input.value)
    });
  });

  wrapper.append(input);
  return wrapper;
}

function createColorSettingControls(device, capability) {
  const controls = [];
  const parameters = capability.parameters || {};
  const state = capability.state || {};

  if (parameters.color_model || state.instance === 'rgb' || state.instance === 'hsv') {
    const wrapper = document.createElement('label');
    wrapper.className = 'color-control';
    const label = document.createElement('span');
    label.textContent = 'Цвет';
    const input = document.createElement('input');
    input.type = 'color';
    const currentValue = state.instance === 'hsv' ? hsvToRgbInt(state.value) : Number(state.value || 0xffffff);
    input.value = rgbIntToHex(currentValue);
    input.addEventListener('change', () => {
      const instance = parameters.color_model === 'hsv' ? 'hsv' : 'rgb';
      const rgb = hexToRgbInt(input.value);
      runDeviceAction(device, capability, {
        instance,
        value: instance === 'rgb' ? rgb : rgbIntToHsv(rgb)
      });
    });
    wrapper.append(label, input);
    controls.push(wrapper);
  }

  if (parameters.temperature_k || state.instance === 'temperature_k') {
    controls.push(createRangeControl(device, {
      ...capability,
      state: {
        instance: 'temperature_k',
        value: state.instance === 'temperature_k' ? state.value : parameters.temperature_k?.min || 2700
      },
      parameters: {
        instance: 'temperature_k',
        range: parameters.temperature_k || { min: 2000, max: 9000, precision: 100 }
      }
    }));
  }

  const scenes = parameters.color_scene?.scenes || parameters.color_scene || [];
  if (Array.isArray(scenes) && scenes.length) {
    const wrapper = document.createElement('div');
    wrapper.className = 'mode-grid';
    scenes.slice(0, 8).forEach((scene) => {
      const value = scene.id || scene.value;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `control-button ${state.instance === 'scene' && state.value === value ? 'active' : ''}`;
      button.textContent = localizeValue(value);
      button.addEventListener('click', () => runDeviceAction(device, capability, { instance: 'scene', value }));
      wrapper.append(button);
    });
    controls.push(wrapper);
  }

  return controls;
}

function createVideoStreamControl(device, capability) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'control-button';
  button.textContent = 'Видеопоток';
  button.addEventListener('click', async () => {
    const protocols = capability.parameters?.protocols || capability.state?.value?.protocols || ['hls'];
    const result = await createDeviceAction(device, capability, {
      instance: 'get_stream',
      value: { protocols }
    });
    const streamUrl = result?.devices?.[0]?.capabilities?.[0]?.state?.value?.stream_url
      || result?.payload?.devices?.[0]?.capabilities?.[0]?.state?.value?.stream_url;
    if (streamUrl) {
      await window.smartHome.openExternal(streamUrl);
    }
  });
  return button;
}

function createModeControl(device, capability) {
  const wrapper = document.createElement('div');
  wrapper.className = 'mode-grid';
  const instance = capability.state?.instance || capability.parameters?.instance || 'mode';
  const currentValue = capability.state?.value;
  const modes = capability.parameters?.modes || [];

  modes.slice(0, 6).forEach((mode) => {
    const button = document.createElement('button');
    const value = mode.value;
    button.type = 'button';
    button.className = `control-button ${value === currentValue ? 'active' : ''}`;
    button.textContent = localizeValue(value);
    button.addEventListener('click', () => {
      runDeviceAction(device, capability, { instance, value });
    });
    wrapper.append(button);
  });

  return wrapper;
}

function renderControls(container, device, options = {}) {
  if (!container) {
    return;
  }

  const capabilities = device.capabilities || [];
  const controls = [];
  const limit = options.limit ?? 4;
  const skipTypes = new Set(options.skipTypes || []);

  capabilities.forEach((capability) => {
    if (!capability.state && !capability.parameters) {
      return;
    }

    if (skipTypes.has(capability.type)) {
      return;
    }

    if (capability.type === 'devices.capabilities.on_off') {
      controls.push(createOnOffControl(device, capability));
      return;
    }

    if (capability.type === 'devices.capabilities.range') {
      controls.push(createRangeControl(device, capability));
      return;
    }

    if (capability.type === 'devices.capabilities.color_setting') {
      controls.push(...createColorSettingControls(device, capability));
      return;
    }

    if (capability.type === 'devices.capabilities.toggle') {
      controls.push(createToggleControl(device, capability));
      return;
    }

    if (capability.type === 'devices.capabilities.video_stream') {
      controls.push(createVideoStreamControl(device, capability));
      return;
    }

    if (capability.type === 'devices.capabilities.mode') {
      controls.push(createModeControl(device, capability));
    }
  });

  controls.forEach((control) => {
    control.addEventListener('click', (event) => event.stopPropagation());
    control.addEventListener('pointerdown', (event) => event.stopPropagation());
  });

  const visibleControls = controls.slice(0, limit);
  container.hidden = visibleControls.length === 0;
  container.replaceChildren(...visibleControls);
}

function getNodeTileLayout(node) {
  return {
    cols: Number(node.dataset.cols) || DEFAULT_TILE_LAYOUT.cols,
    rows: Number(node.dataset.rows) || DEFAULT_TILE_LAYOUT.rows,
    width: Number(node.dataset.width) || TILE_BASE_WIDTH,
    height: Number(node.dataset.height) || MIN_TILE_HEIGHT
  };
}

function attachTileResize(node, id, onResize = null, limits = null) {
  node.querySelectorAll('.resize-handle').forEach((handle) => {
    handle.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      event.stopPropagation();

      const axis = handle.dataset.resizeAxis;
      const startX = event.clientX;
      const startY = event.clientY;
      const startLayout = getTileLayout(id);
      const resizeLimits = limits || getTileResizeLimits();

      node.classList.add('is-resizing');
      handle.setPointerCapture(event.pointerId);
      let resizeFrame = null;

      const requestResizeUpdate = () => {
        if (!onResize || resizeFrame) {
          return;
        }

        resizeFrame = window.requestAnimationFrame(() => {
          resizeFrame = null;
          onResize();
        });
      };

      const onPointerMove = (moveEvent) => {
        const deltaWidth = axis.includes('x') ? moveEvent.clientX - startX : 0;
        const deltaHeight = axis.includes('y') ? moveEvent.clientY - startY : 0;
        const nextLayout = {
          width: clamp(startLayout.width + deltaWidth, resizeLimits.minWidth, resizeLimits.maxWidth),
          height: clamp(startLayout.height + deltaHeight, resizeLimits.minHeight, resizeLimits.maxHeight)
        };

        applyTileLayout(node, nextLayout);
        requestResizeUpdate();
      };

      const onPointerUp = () => {
        const nextLayout = {
          width: Number(node.dataset.width) || startLayout.width,
          height: Number(node.dataset.height) || startLayout.height,
          cols: Number(node.dataset.cols) || startLayout.cols,
          rows: Number(node.dataset.rows) || startLayout.rows
        };

        node.classList.remove('is-resizing');
        if (resizeFrame) {
          window.cancelAnimationFrame(resizeFrame);
          resizeFrame = null;
        }
        onResize?.();
        setTileLayout(id, nextLayout);
        renderTiles();
        handle.removeEventListener('pointermove', onPointerMove);
        handle.removeEventListener('pointerup', onPointerUp);
        handle.removeEventListener('pointercancel', onPointerUp);
      };

      handle.addEventListener('pointermove', onPointerMove);
      handle.addEventListener('pointerup', onPointerUp);
      handle.addEventListener('pointercancel', onPointerUp);
    });
  });
}

function createPropertyChips(device, layout) {
  const propertyChips = (device.properties || [])
    .slice()
    .sort((a, b) => getPropertyPriority(a) - getPropertyPriority(b))
    .map((property) => {
      const instance = getPropertyInstance(property);
      const value = getPropertyDisplayValue(property);
      return value ? { property, instance, text: `${getPropertyIcon(instance)} ${value}` } : null;
    })
    .filter(Boolean)
    .slice(0, getTilePropertyLimit(layout, device))
    .map(({ instance, text }) => {
      const metricKey = getMetricKey(device.id, instance);
      const chip = document.createElement('span');
      chip.className = `property-chip ${isMetricPinned(metricKey) ? 'pinned' : ''}`;
      chip.textContent = text;
      chip.title = 'Открыть историю. ПКМ: показать на панели Windows';
      chip.addEventListener('click', (event) => {
        event.stopPropagation();
        openMetricHistory(device.id, instance);
      });
      chip.addEventListener('contextmenu', async (event) => {
        event.preventDefault();
        event.stopPropagation();
        await toggleMetricPinned(metricKey);
        chip.classList.toggle('pinned', isMetricPinned(metricKey));
      });
      return chip;
    });

  if (device.state === 'offline') {
    const chip = document.createElement('span');
    chip.className = 'property-chip';
    chip.textContent = 'offline';
    propertyChips.unshift(chip);
  }

  return propertyChips;
}

function updateDeviceTileAdaptiveContent(node, device) {
  const layout = getNodeTileLayout(node);
  const propertyRow = node.querySelector('.property-row');
  const chips = createPropertyChips(device, layout);
  if (propertyRow) {
    propertyRow.hidden = chips.length === 0;
    propertyRow.replaceChildren(...chips);
  }
  renderControls(node.querySelector('.control-area'), device, {
    limit: getTileControlLimit(layout, device),
    skipTypes: ['devices.capabilities.on_off']
  });
}

function createDeviceTile(device) {
  const node = elements.deviceTileTemplate.content.firstElementChild.cloneNode(true);
  const limits = getTileResizeLimits(device);
  const layout = clampTileLayoutToLimits(getTileLayout(device.id), limits);
  applyTileLayout(node, layout);
  node.classList.toggle('is-on', isDeviceOn(device));
  node.classList.toggle('is-off', Boolean(getOnOffCapability(device)) && !isDeviceOn(device));
  node.querySelector('.device-icon').innerHTML = getDeviceIcon(device.type);
  node.querySelector('.room-name').textContent = getRoomName(device.room);
  node.querySelector('.device-name').textContent = device.name;
  const existingSwitch = node.querySelector('.power-switch');
  const powerSwitch = createPowerSwitch(device);
  if (powerSwitch) {
    existingSwitch.replaceWith(powerSwitch);
  } else {
    existingSwitch.remove();
  }
  [node.querySelector('.tile-header'), node.querySelector('.room-name'), node.querySelector('.device-name')]
    .filter(Boolean)
    .forEach((openArea) => {
      openArea.classList.add('tile-open-area');
      openArea.addEventListener('click', (event) => {
        event.stopPropagation();
        openDeviceDetails(device.id);
      });
    });
  attachTileResize(node, device.id, () => updateDeviceTileAdaptiveContent(node, device), limits);
  updateDeviceTileAdaptiveContent(node, device);
  return node;
}

function createScenarioTile(scenario) {
  const tile = document.createElement('article');
  tile.className = 'device-tile';
  applyTileLayout(tile, getTileLayout(`scenario:${scenario.id}`));
  tile.innerHTML = `
    <div class="tile-main">
      <div class="tile-header">
        <div class="device-icon" aria-hidden="true">${iconMap.default}</div>
      </div>
      <div class="device-body">
        <div class="room-name">Сценарий</div>
        <h2 class="device-name"></h2>
        <div class="property-row"></div>
      </div>
      <div class="control-area">
        <button class="scenario-button" type="button">Запустить</button>
      </div>
    </div>
    <div class="resize-handle resize-e" data-resize-axis="x" aria-hidden="true"></div>
    <div class="resize-handle resize-s" data-resize-axis="y" aria-hidden="true"></div>
    <div class="resize-handle resize-se" data-resize-axis="xy" aria-hidden="true"></div>
  `;

  tile.querySelector('.device-name').textContent = scenario.name;
  attachTileResize(tile, `scenario:${scenario.id}`);
  tile.querySelector('.scenario-button').addEventListener('click', async () => {
    if (!state.isDemo) {
      await window.smartHome.scenarioAction(scenario.id);
    }
  });

  return tile;
}

function findDeviceById(deviceId) {
  return state.home.devices.find((device) => device.id === deviceId) || null;
}

async function loadDeviceDetails(deviceId) {
  const fallbackDevice = findDeviceById(deviceId);

  if (state.isDemo || !window.smartHome) {
    return fallbackDevice;
  }

  try {
    const detailedDevice = await window.smartHome.getDevice(deviceId);
    return {
      ...fallbackDevice,
      ...detailedDevice
    };
  } catch (error) {
    return fallbackDevice;
  }
}

function renderDetailProperties(device) {
  const propertyRows = (device.properties || [])
    .map((property) => {
      const instance = getPropertyInstance(property) || 'Параметр';
      const value = getPropertyDisplayValue(property);
      if (!value) {
        return null;
      }

      const metricKey = getMetricKey(device.id, instance);
      return createDetailRow(localizeInstance(instance), value, getPropertyIcon(instance), {
        clickable: true,
        title: 'Открыть историю. ПКМ: показать на панели Windows',
        onClick: () => openMetricHistory(device.id, instance),
        onContextMenu: async (event) => {
          event.preventDefault();
          await toggleMetricPinned(metricKey);
          event.currentTarget.classList.toggle('pinned', isMetricPinned(metricKey));
        }
      });
    })
    .filter(Boolean);

  if (device.state === 'offline') {
    propertyRows.unshift(createDetailRow('Статус', 'offline', '×'));
  }

  if (propertyRows.length === 0) {
    propertyRows.push(createDetailRow('Параметры', 'нет данных', '•'));
  }

  elements.detailProperties.replaceChildren(...propertyRows);
}

function renderDetailCapabilities(device) {
  const rows = (device.capabilities || []).map((capability) => {
    return createDetailRow(getCapabilityName(capability), formatCapabilityState(capability), '⚙');
  });

  if (rows.length === 0) {
    rows.push(createDetailRow('Управление', 'нет доступных действий', '⚙'));
  }

  elements.detailCapabilities.replaceChildren(...rows);
}

async function openDeviceDetails(deviceId, options = {}) {
  const device = await loadDeviceDetails(deviceId);
  if (!device) {
    return;
  }

  state.activeDeviceId = deviceId;
  state.detailedDevices[deviceId] = device;
  elements.deviceDialog.classList.toggle('is-off', Boolean(getOnOffCapability(device)) && !isDeviceOn(device));
  elements.detailIcon.innerHTML = getDeviceIcon(device.type);
  elements.detailRoom.textContent = getRoomName(device.room);
  elements.detailName.textContent = device.name;
  elements.detailMeta.textContent = `${device.state === 'offline' ? 'Не в сети' : 'В сети'} · ${localizeDeviceType(device.type)}`;

  renderControls(elements.detailControls, device, { limit: Number.POSITIVE_INFINITY });
  renderDetailProperties(device);
  renderDetailCapabilities(device);

  if (!options.silent && !elements.deviceDialog.open) {
    elements.deviceDialog.showModal();
  }
}

function closeDeviceDetails() {
  state.activeDeviceId = null;
  elements.deviceDialog.close();
}

function getVisibleItems() {
  const query = state.search.trim().toLocaleLowerCase('ru-RU');
  const devices = state.home.devices.filter((device) => {
    const matchesRoom = state.filter === 'all' || device.room === state.filter;
    const matchesSearch = !query || `${device.name} ${getRoomName(device.room)}`.toLocaleLowerCase('ru-RU').includes(query);
    return matchesRoom && matchesSearch;
  });

  const scenarios = state.filter === 'scenarios'
    ? state.home.scenarios.filter((scenario) => !query || scenario.name.toLocaleLowerCase('ru-RU').includes(query))
    : [];

  return { devices, scenarios };
}

function renderTiles() {
  const { devices, scenarios } = getVisibleItems();
  const tiles = [
    ...devices.map(createDeviceTile),
    ...scenarios.map(createScenarioTile)
  ];

  if (tiles.length === 0) {
    const emptyState = document.createElement('div');
    emptyState.className = 'empty-state';
    emptyState.textContent = 'Нет элементов для выбранного фильтра.';
    elements.tileGrid.replaceChildren(emptyState);
    return;
  }

  elements.tileGrid.replaceChildren(...tiles);
}

function renderStatus() {
  elements.connectionStatus.textContent = state.isDemo
    ? (state.config.oauthConfigured ? 'Demo-режим, вход не выполнен' : 'OAuth приложения не настроен')
    : 'Подключено к Yandex API';

  elements.homeSummary.textContent = `${state.home.devices.length} устройств, ${state.home.rooms.length} комнат, ${state.home.scenarios.length} сценариев`;
  elements.loginButton.disabled = !state.config.oauthConfigured;
  elements.loginButton.title = state.config.oauthConfigured
    ? ''
    : 'В сборке приложения не задан Yandex OAuth ClientID';
  elements.runInTrayInput.checked = Boolean(state.config.runInTray);
  elements.launchAtLoginInput.checked = Boolean(state.config.launchAtLogin);
  elements.taskbarWidgetInput.checked = Boolean(state.config.enableTaskbarWidget);
}

function render() {
  recordMetricHistory();
  renderStatus();
  renderRoomNavigation();
  renderTabs();
  renderQuickStats();
  renderTiles();
  syncWindowsPanelMetrics();
}

async function refreshHome() {
  try {
    if (!state.config.hasToken) {
      state.home = demoHome;
      state.isDemo = true;
      render();
      return;
    }

    const home = await window.smartHome.getHomeInfo();
    state.home = {
      households: [],
      rooms: [],
      groups: [],
      devices: [],
      scenarios: [],
      ...home
    };
    state.isDemo = false;
    render();
  } catch (error) {
    state.isDemo = true;
    elements.connectionStatus.textContent = error.message || 'Ошибка API';
    renderTiles();
  }
}

function scheduleRefresh() {
  if (state.refreshTimer) {
    window.clearInterval(state.refreshTimer);
  }

  const intervalMs = Math.max(10, Number(state.config.pollIntervalSec || 30)) * 1000;
  state.refreshTimer = window.setInterval(() => {
    if (state.config.hasToken) {
      refreshHome();
    }
  }, intervalMs);
}

async function bootstrap() {
  if (window.smartHome) {
    const appState = await window.smartHome.getState();
    state.config = { ...state.config, ...appState.config };
    window.smartHome.onRefreshRequested(refreshHome);
    window.smartHome.onLoginComplete(async (payload) => {
      if (payload?.ok) {
        const appStateAfterLogin = await window.smartHome.getState();
        state.config = { ...state.config, ...appStateAfterLogin.config };
        await refreshHome();
        return;
      }

      elements.connectionStatus.textContent = payload?.error || 'Ошибка входа через Яндекс';
    });
  }

  elements.refreshButton.addEventListener('click', refreshHome);
  elements.settingsButton.addEventListener('click', () => elements.settingsDialog.showModal());
  elements.closeDeviceDialog.addEventListener('click', closeDeviceDetails);
  elements.closeHistoryDialog.addEventListener('click', closeMetricHistory);
  elements.settingsDialog.addEventListener('click', (event) => {
    if (event.target === elements.settingsDialog) {
      elements.settingsDialog.close();
    }
  });
  elements.deviceDialog.addEventListener('click', (event) => {
    if (event.target === elements.deviceDialog) {
      closeDeviceDetails();
    }
  });
  elements.historyDialog.addEventListener('click', (event) => {
    if (event.target === elements.historyDialog) {
      closeMetricHistory();
    }
  });
  elements.historyRanges.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-range]');
    if (!button || !state.activeMetric) {
      return;
    }

    state.historyRange = button.dataset.range;
    const { deviceId, instance } = parseMetricKey(state.activeMetric);
    openMetricHistory(deviceId, instance);
  });
  elements.pinHistoryMetric.addEventListener('click', async () => {
    if (!state.activeMetric) {
      return;
    }

    await toggleMetricPinned(state.activeMetric);
    elements.pinHistoryMetric.classList.toggle('active', isMetricPinned(state.activeMetric));
  });
  elements.deviceDialog.addEventListener('close', () => {
    state.activeDeviceId = null;
  });
  elements.historyDialog.addEventListener('close', () => {
    state.activeMetric = null;
  });
  elements.searchInput.addEventListener('input', (event) => {
    state.search = event.target.value;
    renderTiles();
  });

  elements.loginButton.addEventListener('click', async () => {
    try {
      elements.loginButton.disabled = true;
      elements.loginButton.textContent = 'Откройте браузер';
      const result = await window.smartHome.startOAuthLogin();
      if (!result.ok) {
        elements.connectionStatus.textContent = result.code === 'OAUTH_CLIENT_ID_MISSING'
          ? 'OAuth ClientID не встроен в сборку'
          : result.message;
        return;
      }

      state.config.oauthRedirectUri = result.redirectUri;
      elements.connectionStatus.textContent = 'Ожидание подтверждения в браузере';
      renderStatus();
    } catch (error) {
      elements.connectionStatus.textContent = error.message || 'Не удалось начать вход';
    } finally {
      elements.loginButton.disabled = !state.config.oauthConfigured;
      elements.loginButton.textContent = 'Войти через Яндекс';
    }
  });

  elements.clearTokenButton.addEventListener('click', async () => {
    await window.smartHome.clearToken();
    state.config.hasToken = false;
    state.home = demoHome;
    state.isDemo = true;
    render();
  });

  elements.runInTrayInput.addEventListener('change', async (event) => {
    state.config.runInTray = event.target.checked;
    await window.smartHome.updateConfig({ runInTray: state.config.runInTray });
  });

  elements.launchAtLoginInput.addEventListener('change', async (event) => {
    state.config.launchAtLogin = event.target.checked;
    await window.smartHome.updateConfig({ launchAtLogin: state.config.launchAtLogin });
  });

  elements.taskbarWidgetInput.addEventListener('change', async (event) => {
    state.config.enableTaskbarWidget = event.target.checked;
    await window.smartHome.updateConfig({ enableTaskbarWidget: state.config.enableTaskbarWidget });
    syncWindowsPanelMetrics();
  });

  render();
  await refreshHome();
  scheduleRefresh();
}

bootstrap();
