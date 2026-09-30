export const STORAGE_KEY = 'speedDial';
export const BACKGROUND_KEY = 'speedDialBackground';
export const SCHEMA_VERSION = 1;
export const EXPORT_FORMAT = 'speed-dial-backup';
export const EXPORT_FILE_PREFIX = 'speed-dial-backup';

export const GROUP_PALETTE = [
  '#4f8ef7',
  '#34c38f',
  '#f5a524',
  '#f2555a',
  '#a06cf0',
  '#12b5cb',
  '#f06db0',
  '#8a94a6',
];

export const THEMES = ['auto', 'dark', 'light'];
export const LAYOUTS = ['tabs', 'sections'];
export const TILE_SIZES = ['s', 'm', 'l'];
export const IMAGE_TYPES = ['auto', 'upload', 'url', 'letter'];
export const IMAGE_FITS = ['contain', 'cover'];
export const COLUMN_RANGE = { min: 3, max: 12, step: 1 };
export const DIM_RANGE = { min: 0, max: 0.8, step: 0.05 };

export const DEFAULT_SETTINGS = {
  theme: 'auto',
  layout: 'tabs',
  tileSize: 'm',
  maxColumns: 8,
  showTitles: true,
  showSearch: true,
  openInNewTab: false,
  remoteIcons: true,
  backgroundDim: 0.4,
  activeGroupId: null,
  collapsed: [],
};

export const ALLOWED_SCHEMES = ['http:', 'https:', 'chrome:', 'chrome-extension:', 'file:'];
const TITLE_DASHES = String.fromCodePoint(0x2013, 0x2014, 0xb7);
export const TITLE_SEPARATORS = new RegExp(` [|${TITLE_DASHES}-] `);
export const MIN_SHORT_TITLE = 3;

export const ICON_MAX_PX = 192;
export const BACKGROUND_MAX_PX = 2560;
export const ICON_QUALITY = 0.92;
export const BACKGROUND_QUALITY = 0.85;
export const OUTPUT_IMAGE_TYPE = 'image/webp';
export const PASSTHROUGH_IMAGE_TYPES = ['image/svg+xml', 'image/gif'];
export const FAVICON_PX = 64;
export const FAVICON_PROBE_PX = 16;
export const FAVICON_PROBE_URL = 'https://speed-dial.invalid/';
export const REMOTE_FAVICON_URL = 'https://www.google.com/s2/favicons';
export const REMOTE_FAVICON_PX = 128;

export const LETTER_TEXT = { onLight: '#111418', onDark: '#ffffff' };
export const BADGE_COLOR = '#34c38f';

export const UNDO_MS = 7000;
export const MOTION_MS = 220;
export const MOTION_EASING = 'cubic-bezier(.2,.8,.2,1)';
export const SPRING_LOAD_MS = 650;
export const PREVIEW_DEBOUNCE_MS = 180;
export const BADGE_MS = 1500;
export const POPUP_CLOSE_MS = 900;
export const TOP_SITES_LIMIT = 12;
export const MENU_OFFSET_PX = 6;
export const VIEWPORT_MARGIN_PX = 8;
export const NEW_TAB_URL = 'chrome://newtab/';
