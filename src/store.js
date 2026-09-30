import {
  STORAGE_KEY,
  BACKGROUND_KEY,
  SCHEMA_VERSION,
  DEFAULT_SETTINGS,
  GROUP_PALETTE,
  THEMES,
  LAYOUTS,
  TILE_SIZES,
  IMAGE_TYPES,
  IMAGE_FITS,
  COLUMN_RANGE,
  DIM_RANGE,
} from './config.js';
import { t } from './i18n.js';

export const uid = () => crypto.randomUUID();

export const createGroup = (name, color) => ({ id: uid(), name, color });

export const createTile = (fields = {}) => ({
  id: uid(),
  url: '',
  title: '',
  groupId: null,
  color: '',
  ...fields,
  image: { type: 'auto', src: '', fit: 'contain', ...fields.image },
});

const isColor = (value) => typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value);
const pick = (value, allowed, fallback) => (allowed.includes(value) ? value : fallback);
const clampNumber = (value, { min, max }, fallback) =>
  Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;

function normalizeImage(image) {
  const source = image && typeof image === 'object' ? image : {};
  return {
    type: pick(source.type, IMAGE_TYPES, 'auto'),
    src: typeof source.src === 'string' ? source.src : '',
    fit: pick(source.fit, IMAGE_FITS, 'contain'),
  };
}

export function normalize(raw) {
  const data = raw && typeof raw === 'object' ? raw : {};
  const groups = (Array.isArray(data.groups) ? data.groups : [])
    .filter((g) => g && typeof g.id === 'string')
    .map((g) => ({
      id: g.id,
      name: String(g.name ?? '').trim() || t('untitledGroup'),
      color: isColor(g.color) ? g.color.toLowerCase() : GROUP_PALETTE[0],
    }));
  if (!groups.length) groups.push(createGroup(t('defaultGroupName'), GROUP_PALETTE[0]));
  const groupIds = new Set(groups.map((g) => g.id));

  const tiles = (Array.isArray(data.tiles) ? data.tiles : [])
    .filter((x) => x && typeof x.id === 'string' && typeof x.url === 'string' && x.url)
    .map((x) => ({
      id: x.id,
      url: x.url,
      title: String(x.title ?? ''),
      groupId: groupIds.has(x.groupId) ? x.groupId : groups[0].id,
      color: isColor(x.color) ? x.color.toLowerCase() : '',
      image: normalizeImage(x.image),
    }));

  const s = { ...DEFAULT_SETTINGS, ...(data.settings && typeof data.settings === 'object' ? data.settings : {}) };
  const settings = {
    theme: pick(s.theme, THEMES, DEFAULT_SETTINGS.theme),
    layout: pick(s.layout, LAYOUTS, DEFAULT_SETTINGS.layout),
    tileSize: pick(s.tileSize, TILE_SIZES, DEFAULT_SETTINGS.tileSize),
    maxColumns: clampNumber(Math.round(s.maxColumns), COLUMN_RANGE, DEFAULT_SETTINGS.maxColumns),
    showTitles: Boolean(s.showTitles),
    showSearch: Boolean(s.showSearch),
    openInNewTab: Boolean(s.openInNewTab),
    remoteIcons: Boolean(s.remoteIcons),
    backgroundDim: clampNumber(Number(s.backgroundDim), DIM_RANGE, DEFAULT_SETTINGS.backgroundDim),
    activeGroupId: groupIds.has(s.activeGroupId) ? s.activeGroupId : groups[0].id,
    collapsed: Array.isArray(s.collapsed) ? s.collapsed.filter((id) => groupIds.has(id)) : [],
  };

  return { version: SCHEMA_VERSION, groups, tiles, settings };
}

let state = null;
let version = 0;
const pendingRevs = new Set();
const listeners = new Set();
const backgroundListeners = new Set();

export const getState = () => state;
export const getVersion = () => version;
export const snapshot = () => structuredClone(state);

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function commit(next, source) {
  state = normalize(next);
  version += 1;
  for (const listener of listeners) listener(state, source);
}

async function persist() {
  const rev = uid();
  pendingRevs.add(rev);
  await chrome.storage.local.set({ [STORAGE_KEY]: { ...state, rev } });
}

export async function load() {
  const { [STORAGE_KEY]: raw } = await chrome.storage.local.get(STORAGE_KEY);
  state = normalize(raw);
  if (!raw) await persist();
  return state;
}

export async function update(mutate) {
  const draft = structuredClone(state);
  mutate(draft);
  commit(draft, 'local');
  await persist();
}

export async function replace(next) {
  commit(next, 'local');
  await persist();
}

export async function getBackground() {
  const { [BACKGROUND_KEY]: image } = await chrome.storage.local.get(BACKGROUND_KEY);
  return typeof image === 'string' ? image : null;
}

export async function setBackground(image) {
  if (image) await chrome.storage.local.set({ [BACKGROUND_KEY]: image });
  else await chrome.storage.local.remove(BACKGROUND_KEY);
}

export function onBackgroundChange(listener) {
  backgroundListeners.add(listener);
}

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local') return;
  if (changes[BACKGROUND_KEY]) {
    for (const listener of backgroundListeners) listener(changes[BACKGROUND_KEY].newValue ?? null);
  }
  const change = changes[STORAGE_KEY];
  if (!change || !state) return;
  const incoming = change.newValue;
  if (incoming?.rev && pendingRevs.delete(incoming.rev)) return;
  commit(incoming, 'external');
});
