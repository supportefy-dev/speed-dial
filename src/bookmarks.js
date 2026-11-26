import { h, icon, debounce } from './dom.js';
import { t } from './i18n.js';
import { openMenu } from './menu.js';
import { getState } from './store.js';
import { faviconUrl, hasFaviconCache, remoteFaviconUrl } from './favicon.js';
import { normalizeUrl, hostLabel } from './urls.js';
import { openUrl, openFromEvent } from './actions.js';
import { BOOKMARKS_PERMISSION, BOOKMARKS_BAR_IDS, BOOKMARK_ICON_PX, BOOKMARKS_REFRESH_MS } from './config.js';

const BOOKMARK_EVENTS = ['onCreated', 'onRemoved', 'onChanged', 'onMoved', 'onChildrenReordered', 'onImportEnded'];

const barEl = () => document.getElementById('bookmarks-bar');
let shownKey = null;
let renderToken = 0;
let listening = false;

export const requestBookmarksAccess = () => chrome.permissions.request(BOOKMARKS_PERMISSION);
export const releaseBookmarksAccess = () => chrome.permissions.remove(BOOKMARKS_PERMISSION);

async function barFolder() {
  const [root] = await chrome.bookmarks.getTree();
  return root.children?.find((node) => node.folderType === 'bookmarks-bar' || BOOKMARKS_BAR_IDS.includes(node.id)) ?? null;
}

const isFolder = (node) => !node.url && node.type !== 'separator';
const linkOf = (node) => (node.url ? normalizeUrl(node.url) : null);
const labelOf = (node, url) => node.title.trim() || hostLabel(url);

function siteIcon(url) {
  const src = hasFaviconCache()
    ? faviconUrl(url, BOOKMARK_ICON_PX)
    : getState().settings.remoteIcons
      ? remoteFaviconUrl(url)
      : null;
  return src ? h('img', { class: 'bm-favicon', src, alt: '', loading: 'lazy' }) : icon('link');
}

function folderItems(folder, anchor) {
  const items = (folder.children ?? [])
    .map((node) => {
      if (isFolder(node)) return { icon: 'folder', label: node.title, action: () => openFolder(node, anchor) };
      const url = linkOf(node);
      if (!url) return null;
      const where = getState().settings.openInNewTab ? 'tab' : 'current';
      return { icon: 'link', label: labelOf(node, url), action: () => openUrl(url, where) };
    })
    .filter(Boolean);
  return items.length ? items : [{ icon: 'folder', label: t('bookmarksFolderEmpty'), disabled: true }];
}

function openFolder(folder, anchor) {
  openMenu(folderItems(folder, anchor), { anchor });
}

function renderNode(node) {
  if (isFolder(node)) {
    const button = h(
      'button',
      { type: 'button', class: 'bm-item', 'aria-haspopup': 'menu', 'aria-expanded': 'false', title: node.title },
      icon('folder'),
      h('span', { class: 'bm-label' }, node.title),
    );
    button.addEventListener('click', () => openFolder(node, button));
    return button;
  }
  const url = linkOf(node);
  if (!url) return null;
  const label = labelOf(node, url);
  return h(
    'a',
    {
      class: 'bm-item',
      href: url,
      title: `${label}\n${url}`,
      onclick: (e) => openFromEvent(e, url),
      onauxclick: (e) => e.button === 1 && openFromEvent(e, url),
    },
    siteIcon(url),
    h('span', { class: 'bm-label' }, label),
  );
}

function hide(el) {
  el.hidden = true;
  el.replaceChildren();
  document.documentElement.classList.remove('has-bookmarks');
}

async function draw() {
  const token = ++renderToken;
  const el = barEl();
  const { settings } = getState();
  const allowed = settings.showBookmarksBar && (await chrome.permissions.contains(BOOKMARKS_PERMISSION));
  if (token !== renderToken) return;
  if (!allowed) return hide(el);
  listen();
  const folder = await barFolder();
  if (token !== renderToken) return;
  const items = (folder?.children ?? []).map(renderNode).filter(Boolean);
  el.replaceChildren(...(items.length ? items : [h('span', { class: 'bm-empty' }, t('bookmarksBarEmpty'))]));
  el.hidden = false;
  document.documentElement.classList.add('has-bookmarks');
}

const redraw = debounce(draw, BOOKMARKS_REFRESH_MS);

function listen() {
  if (listening || !chrome.bookmarks) return;
  listening = true;
  for (const name of BOOKMARK_EVENTS) chrome.bookmarks[name]?.addListener(redraw);
}

export function syncBookmarksBar(settings) {
  const key = `${settings.showBookmarksBar}|${settings.remoteIcons}`;
  if (key === shownKey) return;
  shownKey = key;
  draw();
}

export function initBookmarksBar() {
  chrome.permissions.onAdded.addListener(redraw);
  chrome.permissions.onRemoved.addListener(redraw);
}
