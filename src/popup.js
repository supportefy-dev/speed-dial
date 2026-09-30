import { load, update, createTile } from './store.js';
import { t, applyI18n } from './i18n.js';
import { h, hydrateIcons } from './dom.js';
import { normalizeUrl, shortTitle, hostLabel } from './urls.js';
import { renderTile } from './tiles.js';
import { applyCredits } from './credits.js';
import { POPUP_CLOSE_MS } from './config.js';

const $ = (id) => document.getElementById(id);
const form = $('add-form');

const openSpeedDial = () => chrome.tabs.create({ url: chrome.runtime.getURL(chrome.runtime.getManifest().chrome_url_overrides.newtab) }).then(() => window.close());

function applyTheme(theme) {
  if (theme === 'auto') delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = theme;
}

function renderPreview(state, url) {
  const groupId = form.elements.group.value;
  const group = state.groups.find((g) => g.id === groupId);
  const tile = createTile({ url, title: form.elements.title.value.trim(), groupId });
  $('popup-preview').replaceChildren(renderTile(tile, group, { interactive: false, remoteIcons: state.settings.remoteIcons }));
}

async function init() {
  applyI18n(document);
  hydrateIcons(document);
  applyCredits(document);
  $('popup-open').addEventListener('click', openSpeedDial);
  $('popup-open-alt').addEventListener('click', openSpeedDial);

  const [[tab], state] = await Promise.all([chrome.tabs.query({ active: true, currentWindow: true }), load()]);
  applyTheme(state.settings.theme);
  const url = normalizeUrl(tab?.url);
  if (!url) {
    $('popup-unsupported').hidden = false;
    return;
  }

  const f = form.elements;
  f.title.value = shortTitle(tab.title);
  f.title.placeholder = hostLabel(url);
  f.group.replaceChildren(...state.groups.map((g) => h('option', { value: g.id }, g.name)));
  f.group.value = state.settings.activeGroupId;
  $('popup-url').textContent = hostLabel(url);

  const existing = state.tiles.find((x) => x.url === url);
  if (existing) {
    const group = state.groups.find((g) => g.id === existing.groupId);
    $('popup-note').textContent = t('popupAlreadySaved', [group.name]);
    $('popup-note').hidden = false;
  }

  form.hidden = false;
  renderPreview(state, url);
  form.addEventListener('input', () => renderPreview(state, url));
  f.title.focus();
  f.title.select();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const groupId = f.group.value;
    const group = state.groups.find((g) => g.id === groupId);
    await update((s) => {
      s.tiles.push(createTile({ url, title: f.title.value.trim(), groupId }));
    });
    form.hidden = true;
    $('popup-done-text').textContent = t('popupAdded', [group.name]);
    $('popup-done').hidden = false;
    setTimeout(() => window.close(), POPUP_CLOSE_MS);
  });
}

init();
