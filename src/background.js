import { load, update, createTile } from './store.js';
import { t } from './i18n.js';
import { normalizeUrl, shortTitle } from './urls.js';
import { BADGE_COLOR, BADGE_MS } from './config.js';

const MENU = { page: 'add-page', link: 'add-link' };

chrome.runtime.onInstalled.addListener(async () => {
  await chrome.contextMenus.removeAll();
  chrome.contextMenus.create({ id: MENU.page, title: t('menuAddPage'), contexts: ['page'] });
  chrome.contextMenus.create({ id: MENU.link, title: t('menuAddLink'), contexts: ['link'] });
  await load();
});

async function flashBadge(tabId) {
  if (tabId == null || tabId < 0) return;
  await chrome.action.setBadgeBackgroundColor({ color: BADGE_COLOR, tabId });
  await chrome.action.setBadgeText({ text: t('badgeAdded'), tabId });
  setTimeout(() => chrome.action.setBadgeText({ text: '', tabId }), BADGE_MS);
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const isLink = info.menuItemId === MENU.link;
  const url = normalizeUrl(isLink ? info.linkUrl : info.pageUrl ?? tab?.url);
  if (!url) return;
  const title = isLink ? '' : shortTitle(tab?.title);
  await load();
  await update((s) => {
    s.tiles.push(createTile({ url, title, groupId: s.settings.activeGroupId }));
  });
  await flashBadge(tab?.id);
});
