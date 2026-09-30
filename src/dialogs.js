import { getState, update, createTile, createGroup, getBackground, setBackground, onBackgroundChange } from './store.js';
import { t } from './i18n.js';
import { h, debounce } from './dom.js';
import { renderTile } from './tiles.js';
import { normalizeUrl, hostLabel } from './urls.js';
import { resizeImage, clipboardImage, isImageFile } from './images.js';
import {
  GROUP_PALETTE,
  DEFAULT_SETTINGS,
  ICON_MAX_PX,
  ICON_QUALITY,
  BACKGROUND_MAX_PX,
  BACKGROUND_QUALITY,
  PREVIEW_DEBOUNCE_MS,
  COLUMN_RANGE,
  DIM_RANGE,
} from './config.js';
import * as actions from './actions.js';

const $ = (id) => document.getElementById(id);

function swatchPicker(container, name, { allowDefault, onChange }) {
  const radios = [];
  const option = (value, label, extraClass = '') => {
    const input = h('input', { type: 'radio', name, value, 'aria-label': label });
    input.addEventListener('change', () => {
      custom.classList.remove('selected');
      onChange();
    });
    radios.push(input);
    return h('label', { class: `swatch ${extraClass}`, title: label, style: { '--swatch': value || 'transparent' } }, input, h('span'));
  };
  const customInput = h('input', { type: 'color', 'aria-label': t('colorCustom') });
  const custom = h('label', { class: 'swatch custom', title: t('colorCustom') }, customInput, h('span'));
  customInput.addEventListener('input', () => {
    for (const r of radios) r.checked = false;
    custom.classList.add('selected');
    custom.style.setProperty('--swatch', customInput.value);
    onChange();
  });
  const options = GROUP_PALETTE.map((color) => option(color, color));
  if (allowDefault) options.unshift(option('', t('colorGroupDefault'), 'default'));
  container.replaceChildren(...options, custom);

  return {
    get: () => radios.find((r) => r.checked)?.value ?? (custom.classList.contains('selected') ? customInput.value : ''),
    set(value) {
      const match = radios.find((r) => r.value === value);
      for (const r of radios) r.checked = r === match;
      custom.classList.toggle('selected', !match);
      if (!match) {
        customInput.value = value;
        custom.style.setProperty('--swatch', value);
      }
    },
  };
}

function setError(el, input, key) {
  el.hidden = !key;
  el.textContent = key ? t(key) : '';
  input?.setAttribute('aria-invalid', String(Boolean(key)));
}

function bindModal(dialog) {
  let pressedOnBackdrop = false;
  dialog.addEventListener('pointerdown', (e) => {
    pressedOnBackdrop = e.target === dialog;
  });
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog && pressedOnBackdrop) dialog.close();
  });
  for (const button of dialog.querySelectorAll('[data-close]')) button.addEventListener('click', () => dialog.close());
}

const tileDialog = $('tile-dialog');
const tileForm = $('tile-form');
const urlError = $('url-error');
const imageError = $('image-error');
let tileDraft = null;
let tileColor = null;

function readTileForm() {
  const f = tileForm.elements;
  const type = f.imageType.value;
  const src = type === 'upload' ? tileDraft.uploadSrc : type === 'url' ? normalizeUrl(f.imageUrl.value) ?? '' : '';
  return {
    id: tileDraft.id,
    url: normalizeUrl(f.url.value) ?? '',
    title: f.title.value.trim(),
    groupId: f.group.value,
    color: tileColor.get(),
    image: { type, src, fit: f.fit.checked ? 'cover' : 'contain' },
  };
}

function syncTilePanels() {
  const type = tileForm.elements.imageType.value;
  for (const el of tileForm.querySelectorAll('[data-panel]')) el.hidden = !el.dataset.panel.split(' ').includes(type);
  $('dropzone-label').textContent = t(tileDraft.uploadSrc ? 'uploadReplace' : 'uploadPrompt');
}

function refreshPreview() {
  const tile = readTileForm();
  const group = getState().groups.find((g) => g.id === tile.groupId) ?? getState().groups[0];
  $('tile-preview').replaceChildren(renderTile(tile, group, { interactive: false, remoteIcons: getState().settings.remoteIcons }));
  tileForm.elements.title.placeholder = tile.url ? hostLabel(tile.url) : t('titlePlaceholder');
}

const refreshPreviewSoon = debounce(refreshPreview, PREVIEW_DEBOUNCE_MS);

async function useImageFile(file) {
  if (!isImageFile(file)) return setError(imageError, null, 'errorNotImage');
  try {
    tileDraft.uploadSrc = await resizeImage(file, ICON_MAX_PX, ICON_QUALITY);
  } catch {
    return setError(imageError, null, 'errorReadImage');
  }
  tileForm.elements.imageType.value = 'upload';
  setError(imageError, null, null);
  syncTilePanels();
  refreshPreview();
}

export function openTileEditor({ tileId, groupId, url = '', title = '' } = {}) {
  const state = getState();
  const existing = tileId && state.tiles.find((x) => x.id === tileId);
  const tile = existing ?? createTile({ groupId: groupId ?? state.settings.activeGroupId, url, title });
  tileDraft = { id: tile.id, uploadSrc: tile.image.type === 'upload' ? tile.image.src : '' };

  const f = tileForm.elements;
  $('tile-dialog-title').textContent = t(existing ? 'editSite' : 'addSite');
  f.url.value = tile.url;
  f.title.value = tile.title;
  f.group.replaceChildren(...state.groups.map((g) => h('option', { value: g.id }, g.name)));
  f.group.value = tile.groupId;
  f.imageType.value = tile.image.type;
  f.imageUrl.value = tile.image.type === 'url' ? tile.image.src : '';
  f.fit.checked = tile.image.fit === 'cover';
  tileColor.set(tile.color);
  setError(urlError, f.url, null);
  setError(imageError, null, null);
  $('tile-delete').hidden = !existing;
  syncTilePanels();
  refreshPreview();
  tileDialog.showModal();
  f.url.focus();
  f.url.select();
}

function initTileEditor() {
  bindModal(tileDialog);
  tileColor = swatchPicker($('tile-swatches'), 'tileColor', { allowDefault: true, onChange: refreshPreview });

  tileForm.addEventListener('input', (e) => {
    if (e.target.name === 'url') setError(urlError, e.target, null);
    if (e.target.name === 'url' || e.target.name === 'imageUrl') refreshPreviewSoon();
    else refreshPreview();
  });
  tileForm.addEventListener('change', (e) => {
    if (e.target.name === 'imageType') {
      setError(imageError, null, null);
      syncTilePanels();
      refreshPreview();
    }
  });

  const fileInput = $('file-image');
  const dropzone = $('dropzone');
  dropzone.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => {
    if (fileInput.files[0]) useImageFile(fileInput.files[0]);
    fileInput.value = '';
  });
  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('over');
  });
  dropzone.addEventListener('dragleave', () => dropzone.classList.remove('over'));
  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('over');
    if (e.dataTransfer.files[0]) useImageFile(e.dataTransfer.files[0]);
  });
  tileDialog.addEventListener('paste', (e) => {
    const file = clipboardImage(e);
    if (!file) return;
    e.preventDefault();
    useImageFile(file);
  });

  $('tile-delete').addEventListener('click', () => {
    tileDialog.close();
    actions.deleteTile(tileDraft.id);
  });

  tileForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const tile = readTileForm();
    if (!tile.url) {
      setError(urlError, tileForm.elements.url, 'errorUrl');
      return tileForm.elements.url.focus();
    }
    if ((tile.image.type === 'upload' || tile.image.type === 'url') && !tile.image.src) {
      return setError(imageError, null, tile.image.type === 'upload' ? 'errorUpload' : 'errorImageUrl');
    }
    await update((s) => {
      const index = s.tiles.findIndex((x) => x.id === tile.id);
      if (index >= 0) s.tiles[index] = tile;
      else s.tiles.push(tile);
      if (s.settings.layout === 'tabs') s.settings.activeGroupId = tile.groupId;
    });
    tileDialog.close();
  });
}

const groupDialog = $('group-dialog');
const groupForm = $('group-form');
const groupError = $('group-error');
let groupDraftId = null;
let groupColor = null;

function refreshGroupPreview() {
  const preview = $('group-preview');
  preview.style.setProperty('--accent', groupColor.get() || GROUP_PALETTE[0]);
  preview.setAttribute('aria-selected', 'true');
  preview.replaceChildren(h('span', { class: 'dot' }), h('span', {}, groupForm.elements.name.value.trim() || t('groupNamePlaceholder')));
}

export function openGroupEditor(groupId) {
  const state = getState();
  const group = groupId && state.groups.find((g) => g.id === groupId);
  groupDraftId = group?.id ?? null;
  $('group-dialog-title').textContent = t(group ? 'editGroup' : 'newGroup');
  groupForm.elements.name.value = group?.name ?? '';
  groupColor.set(group?.color ?? actions.nextGroupColor());
  setError(groupError, groupForm.elements.name, null);
  $('group-delete').hidden = !group || state.groups.length < 2;
  refreshGroupPreview();
  groupDialog.showModal();
  groupForm.elements.name.focus();
  groupForm.elements.name.select();
}

function initGroupEditor() {
  bindModal(groupDialog);
  groupColor = swatchPicker($('group-swatches'), 'groupColor', { allowDefault: false, onChange: refreshGroupPreview });
  groupForm.addEventListener('input', () => {
    setError(groupError, groupForm.elements.name, null);
    refreshGroupPreview();
  });
  $('group-delete').addEventListener('click', () => {
    groupDialog.close();
    actions.deleteGroup(groupDraftId);
  });
  groupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = groupForm.elements.name.value.trim();
    if (!name) {
      setError(groupError, groupForm.elements.name, 'errorGroupName');
      return groupForm.elements.name.focus();
    }
    const color = groupColor.get() || GROUP_PALETTE[0];
    await update((s) => {
      const group = s.groups.find((g) => g.id === groupDraftId);
      if (group) Object.assign(group, { name, color });
      else {
        const created = createGroup(name, color);
        s.groups.push(created);
        s.settings.activeGroupId = created.id;
      }
    });
    groupDialog.close();
  });
}

const settingsDialog = $('settings-dialog');
const settingsForm = $('settings-form');
const percent = (value) => `${Math.round(value * 100)}%`;

function renderBackgroundThumb(image) {
  const thumb = $('bg-thumb');
  thumb.style.backgroundImage = image ? `url("${image}")` : '';
  thumb.classList.toggle('has-image', Boolean(image));
  $('bg-remove').hidden = !image;
  $('dim-row').hidden = !image;
}

export async function openSettings() {
  const { settings } = getState();
  const f = settingsForm.elements;
  for (const key of ['theme', 'layout', 'tileSize']) f[key].value = settings[key];
  for (const key of ['showTitles', 'showSearch', 'openInNewTab', 'remoteIcons']) f[key].checked = settings[key];
  f.maxColumns.value = settings.maxColumns;
  f.backgroundDim.value = settings.backgroundDim;
  $('columns-out').textContent = settings.maxColumns;
  $('dim-out').textContent = percent(settings.backgroundDim);
  renderBackgroundThumb(await getBackground());
  settingsDialog.showModal();
}

function readSetting(el) {
  if (el.type === 'checkbox') return el.checked;
  if (el.type === 'range') return Number(el.value);
  return el.value;
}

function initSettings() {
  bindModal(settingsDialog);
  const f = settingsForm.elements;
  Object.assign(f.maxColumns, { min: COLUMN_RANGE.min, max: COLUMN_RANGE.max, step: COLUMN_RANGE.step });
  Object.assign(f.backgroundDim, { min: DIM_RANGE.min, max: DIM_RANGE.max, step: DIM_RANGE.step });

  settingsForm.addEventListener('submit', (e) => e.preventDefault());
  settingsForm.addEventListener('input', (e) => {
    const { name, value } = e.target;
    if (name === 'maxColumns') {
      $('columns-out').textContent = value;
      document.documentElement.style.setProperty('--max-cols', value);
    } else if (name === 'backgroundDim') {
      $('dim-out').textContent = percent(Number(value));
      document.documentElement.style.setProperty('--bg-dim', value);
    }
  });
  settingsForm.addEventListener('change', (e) => {
    const { name } = e.target;
    if (!(name in DEFAULT_SETTINGS)) return;
    const value = readSetting(e.target);
    update((s) => {
      s.settings[name] = value;
    });
  });

  const bgInput = $('file-background');
  $('bg-choose').addEventListener('click', () => bgInput.click());
  bgInput.addEventListener('change', async () => {
    const file = bgInput.files[0];
    bgInput.value = '';
    if (!isImageFile(file)) return;
    await setBackground(await resizeImage(file, BACKGROUND_MAX_PX, BACKGROUND_QUALITY));
  });
  $('bg-remove').addEventListener('click', () => setBackground(null));
  onBackgroundChange(renderBackgroundThumb);

  $('data-import-top').addEventListener('click', () => {
    settingsDialog.close();
    actions.importTopSites(getState().settings.activeGroupId);
  });
  $('data-export').addEventListener('click', () => actions.exportBackup());
  const backupInput = $('file-backup');
  $('data-restore').addEventListener('click', () => backupInput.click());
  backupInput.addEventListener('change', () => {
    const file = backupInput.files[0];
    backupInput.value = '';
    if (!file) return;
    settingsDialog.close();
    actions.restoreBackup(file);
  });
}

export function initDialogs() {
  initTileEditor();
  initGroupEditor();
  initSettings();
}
