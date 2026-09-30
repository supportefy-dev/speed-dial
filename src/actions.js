import {
  getState,
  getVersion,
  update,
  replace,
  snapshot,
  createTile,
  getBackground,
  setBackground,
} from './store.js';
import { showToast } from './toast.js';
import { t } from './i18n.js';
import { normalizeUrl, shortTitle, tileLabel } from './urls.js';
import { EXPORT_FORMAT, EXPORT_FILE_PREFIX, SCHEMA_VERSION, TOP_SITES_LIMIT, GROUP_PALETTE } from './config.js';

export const findTile = (id) => getState().tiles.find((x) => x.id === id);
export const findGroup = (id) => getState().groups.find((g) => g.id === id);
export const groupTiles = (groupId) => getState().tiles.filter((x) => x.groupId === groupId);

async function withUndo(message, mutate) {
  const before = snapshot();
  await update(mutate);
  const at = getVersion();
  showToast(message, {
    version: at,
    undo: () => getVersion() === at && replace(before),
  });
}

export function openUrl(url, where = 'current', active = true) {
  if (where === 'window') return chrome.windows.create({ url });
  if (where === 'tab') return chrome.tabs.create({ url, active });
  return chrome.tabs.update({ url });
}

export function openAll(groupId) {
  for (const tile of groupTiles(groupId)) chrome.tabs.create({ url: tile.url, active: false });
}

export function setActiveGroup(groupId) {
  if (getState().settings.activeGroupId === groupId) return;
  return update((s) => {
    s.settings.activeGroupId = groupId;
  });
}

export function deleteTile(id) {
  const tile = findTile(id);
  if (!tile) return;
  return withUndo(t('toastTileDeleted', [tileLabel(tile)]), (s) => {
    s.tiles = s.tiles.filter((x) => x.id !== id);
  });
}

export function moveTileToGroup(id, groupId) {
  const tile = findTile(id);
  const group = findGroup(groupId);
  if (!tile || !group || tile.groupId === groupId) return;
  return withUndo(t('toastTileMoved', [tileLabel(tile), group.name]), (s) => {
    const index = s.tiles.findIndex((x) => x.id === id);
    const [moved] = s.tiles.splice(index, 1);
    moved.groupId = groupId;
    s.tiles.push(moved);
  });
}

export function reorderGroup(groupId, orderedIds) {
  return update((s) => {
    const ids = new Set(orderedIds);
    const ordered = orderedIds.map((id) => s.tiles.find((x) => x.id === id)).filter(Boolean);
    for (const tile of ordered) tile.groupId = groupId;
    s.tiles = s.tiles.filter((x) => !ids.has(x.id)).concat(ordered);
  });
}

export function nudgeTile(id, delta) {
  return update((s) => {
    const tile = s.tiles.find((x) => x.id === id);
    if (!tile) return;
    const siblings = s.tiles.filter((x) => x.groupId === tile.groupId);
    const target = siblings[siblings.indexOf(tile) + delta];
    if (!target) return;
    const a = s.tiles.indexOf(tile);
    const b = s.tiles.indexOf(target);
    [s.tiles[a], s.tiles[b]] = [s.tiles[b], s.tiles[a]];
  });
}

export function reorderGroups(orderedIds) {
  return update((s) => {
    const ordered = orderedIds.map((id) => s.groups.find((g) => g.id === id)).filter(Boolean);
    s.groups = ordered.concat(s.groups.filter((g) => !orderedIds.includes(g.id)));
  });
}

export function toggleSection(groupId) {
  return update((s) => {
    const collapsed = new Set(s.settings.collapsed);
    if (!collapsed.delete(groupId)) collapsed.add(groupId);
    s.settings.collapsed = [...collapsed];
  });
}

export function deleteGroup(id) {
  const group = findGroup(id);
  if (!group || getState().groups.length < 2) return;
  const count = groupTiles(id).length;
  const message = count
    ? t('toastGroupDeletedWithSites', [group.name, String(count)])
    : t('toastGroupDeleted', [group.name]);
  return withUndo(message, (s) => {
    s.groups = s.groups.filter((g) => g.id !== id);
    s.tiles = s.tiles.filter((x) => x.groupId !== id);
  });
}

export function nextGroupColor() {
  const used = new Set(getState().groups.map((g) => g.color));
  return GROUP_PALETTE.find((c) => !used.has(c)) ?? GROUP_PALETTE[getState().groups.length % GROUP_PALETTE.length];
}

export function addTileFromDrop(groupId, rawUrl, title) {
  const url = normalizeUrl(rawUrl);
  if (!url) return;
  const tile = createTile({ url, title: shortTitle(title), groupId });
  return withUndo(t('toastTileAdded', [tileLabel(tile)]), (s) => {
    s.tiles.push(tile);
  });
}

export function setTileImage(id, src) {
  return update((s) => {
    const tile = s.tiles.find((x) => x.id === id);
    if (tile) tile.image = { type: 'upload', src, fit: tile.image.fit };
  });
}

export async function importTopSites(groupId) {
  const sites = await chrome.topSites.get();
  const saved = new Set(getState().tiles.map((x) => x.url));
  const fresh = sites
    .map((site) => ({ url: normalizeUrl(site.url), title: shortTitle(site.title) }))
    .filter((site) => site.url && !saved.has(site.url))
    .slice(0, TOP_SITES_LIMIT);
  if (!fresh.length) return showToast(t('toastImportNothing'));
  return withUndo(t('toastImported', [String(fresh.length)]), (s) => {
    for (const site of fresh) s.tiles.push(createTile({ ...site, groupId }));
    s.settings.activeGroupId = groupId;
  });
}

export async function exportBackup() {
  const payload = {
    format: EXPORT_FORMAT,
    version: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    data: snapshot(),
    background: await getBackground(),
  };
  const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
  const href = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = href;
  link.download = `${EXPORT_FILE_PREFIX}-${payload.exportedAt.slice(0, 10)}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(href));
  showToast(t('toastExported'));
}

export async function restoreBackup(file) {
  let payload;
  try {
    payload = JSON.parse(await file.text());
  } catch {
    payload = null;
  }
  if (payload?.format !== EXPORT_FORMAT || !payload.data) return showToast(t('toastRestoreInvalid'));
  const before = snapshot();
  const beforeBackground = await getBackground();
  await replace(payload.data);
  await setBackground(typeof payload.background === 'string' ? payload.background : null);
  const at = getVersion();
  showToast(t('toastRestored'), {
    version: at,
    undo: async () => {
      if (getVersion() !== at) return;
      await replace(before);
      await setBackground(beforeBackground);
    },
  });
}
