import { load, getState, subscribe, getVersion, getBackground, onBackgroundChange } from './store.js';
import { t, applyI18n } from './i18n.js';
import { h, icon, flip, hydrateIcons } from './dom.js';
import { renderTile, renderAddTile, tileSignature } from './tiles.js';
import { tileLabel, needsTabsApi } from './urls.js';
import { openMenu, initMenu } from './menu.js';
import { expireToast } from './toast.js';
import { initDialogs, openTileEditor, openGroupEditor, openSettings } from './dialogs.js';
import { initDnd } from './dnd.js';
import { applyCredits } from './credits.js';
import { loadLicense, onLicenseChange, canAddGroup } from './license.js';
import { initPro } from './pro.js';
import { resizeImage, isImageFile } from './images.js';
import { ICON_MAX_PX, ICON_QUALITY } from './config.js';
import * as actions from './actions.js';

const els = {
  root: document.documentElement,
  board: document.getElementById('board'),
  groups: document.getElementById('groups'),
  search: document.getElementById('search'),
  searchInput: document.getElementById('search-input'),
  backdrop: document.getElementById('backdrop'),
};

const tileCache = new Map();
let query = '';
let lastView = null;
let dnd = null;

const groupById = (state, id) => state.groups.find((g) => g.id === id);

const iconOptions = (state) => ({ remoteIcons: state.settings.remoteIcons });

function tileElement(tile, group, options) {
  const sig = tileSignature(tile, group, options);
  const cached = tileCache.get(tile.id);
  if (cached?.sig === sig) return cached.el;
  const el = renderTile(tile, group, options);
  tileCache.set(tile.id, { sig, el });
  return el;
}

function renderGrid(state, group, { enter }) {
  const tiles = state.tiles.filter((x) => x.groupId === group.id).map((tile) => tileElement(tile, group, iconOptions(state)));
  for (const el of tiles) el.draggable = true;
  return h('div', { class: `grid${enter ? ' enter' : ''}`, 'data-group': group.id }, tiles, renderAddTile(group));
}

function renderEmptyHint(group) {
  return h(
    'div',
    { class: 'empty' },
    h('h2', {}, t('emptyTitle')),
    h('p', {}, t('emptyBody')),
    h(
      'div',
      { class: 'empty-actions' },
      h('button', { type: 'button', class: 'btn primary', 'data-action': 'add-tile', 'data-group': group.id }, icon('plus'), t('addSite')),
      h('button', { type: 'button', class: 'btn', 'data-action': 'import-top', 'data-group': group.id }, icon('history'), t('importTopSites')),
    ),
  );
}

function renderTabsView(state, enter) {
  const group = groupById(state, state.settings.activeGroupId);
  const grid = renderGrid(state, group, { enter });
  grid.id = 'board-panel';
  grid.setAttribute('role', 'tabpanel');
  grid.setAttribute('aria-label', group.name);
  const empty = !state.tiles.some((x) => x.groupId === group.id);
  return [grid, empty && renderEmptyHint(group)];
}

function renderSection(state, group) {
  const collapsed = state.settings.collapsed.includes(group.id);
  const count = state.tiles.filter((x) => x.groupId === group.id).length;
  return h(
    'section',
    { class: `section${collapsed ? ' collapsed' : ''}`, 'data-group-id': group.id, style: { '--accent': group.color } },
    h(
      'header',
      { class: 'section-head', draggable: 'true', 'data-drag-group': '', 'data-drop-group': group.id },
      h(
        'button',
        { type: 'button', class: 'section-toggle', 'data-action': 'toggle-section', 'data-group': group.id, 'aria-expanded': String(!collapsed) },
        icon('chevron'),
        h('span', { class: 'dot' }),
        h('span', { class: 'section-name' }, group.name),
        h('span', { class: 'count' }, String(count)),
      ),
      h(
        'button',
        {
          type: 'button',
          class: 'icon-btn small',
          'data-action': 'group-menu',
          'data-group': group.id,
          'aria-haspopup': 'menu',
          'aria-expanded': 'false',
          'aria-label': t('groupOptions', [group.name]),
        },
        icon('more'),
      ),
    ),
    !collapsed && renderGrid(state, group, { enter: false }),
  );
}

const proBadge = () => h('span', { class: 'pro-badge' }, t('proBadge'));

function renderAddSection(state) {
  const locked = !canAddGroup(state.groups.length);
  return h(
    'button',
    { type: 'button', class: `add-section${locked ? ' locked' : ''}`, 'data-action': 'add-group', title: locked ? t('proLockedGroup') : null },
    icon('plus'),
    t('newGroup'),
    locked && proBadge(),
  );
}

function renderResults(state) {
  const needle = query.toLowerCase();
  const matches = state.tiles.filter((x) => tileLabel(x).toLowerCase().includes(needle) || x.url.toLowerCase().includes(needle));
  if (!matches.length) return h('p', { class: 'results-note' }, t('noMatches', [query]));
  const tiles = matches.map((tile) => tileElement(tile, groupById(state, tile.groupId), iconOptions(state)));
  for (const el of tiles) el.draggable = false;
  return [h('p', { class: 'results-note' }, t('resultsCount', [String(matches.length)])), h('div', { class: 'grid results' }, tiles)];
}

function renderGroupsBar(state) {
  const show = state.settings.layout === 'tabs' && !query;
  els.groups.hidden = !show;
  if (!show) return;
  const counts = new Map();
  for (const tile of state.tiles) counts.set(tile.groupId, (counts.get(tile.groupId) ?? 0) + 1);
  const pills = state.groups.map((group) => {
    const active = group.id === state.settings.activeGroupId;
    return h(
      'button',
      {
        type: 'button',
        role: 'tab',
        class: 'pill',
        draggable: 'true',
        tabindex: active ? '0' : '-1',
        'aria-selected': String(active),
        'aria-controls': 'board-panel',
        'data-group-id': group.id,
        'data-drag-group': '',
        'data-drop-group': group.id,
        style: { '--accent': group.color },
      },
      h('span', { class: 'dot' }),
      h('span', { class: 'pill-name' }, group.name),
      h('span', { class: 'count' }, String(counts.get(group.id) ?? 0)),
    );
  });
  const locked = !canAddGroup(state.groups.length);
  const add = h(
    'button',
    {
      type: 'button',
      class: `pill pill-add${locked ? ' locked' : ''}`,
      'data-action': 'add-group',
      'aria-label': locked ? t('proLockedGroup') : t('newGroup'),
      title: locked ? t('proLockedGroup') : t('newGroup'),
    },
    icon('plus'),
    locked && proBadge(),
  );
  flip(els.groups, () => els.groups.replaceChildren(...pills, add));
}

function renderBoard(state) {
  const { layout, activeGroupId } = state.settings;
  const view = query ? 'results' : `${layout}:${layout === 'tabs' ? activeGroupId : ''}`;
  const enter = lastView !== null && view !== lastView && layout === 'tabs' && !query;
  lastView = view;
  let content;
  if (query) content = renderResults(state);
  else if (layout === 'sections') content = [...state.groups.map((group) => renderSection(state, group)), renderAddSection(state)];
  else content = renderTabsView(state, enter);
  els.board.dataset.layout = query ? 'results' : layout;
  flip(els.board, () => els.board.replaceChildren(...[content].flat().filter(Boolean)));
  const live = new Set(state.tiles.map((x) => x.id));
  for (const id of tileCache.keys()) if (!live.has(id)) tileCache.delete(id);
}

function applyAppearance(settings) {
  const { root } = els;
  if (settings.theme === 'auto') delete root.dataset.theme;
  else root.dataset.theme = settings.theme;
  try {
    localStorage.setItem(window.speedDialBoot.themeKey, settings.theme);
  } catch {
    // Theme caching is a flash-of-wrong-theme optimisation only.
  }
  root.dataset.tileSize = settings.tileSize;
  root.dataset.titles = String(settings.showTitles);
  root.style.setProperty('--max-cols', String(settings.maxColumns));
  root.style.setProperty('--bg-dim', String(settings.backgroundDim));
  els.search.hidden = !settings.showSearch;
  if (!settings.showSearch && query) {
    query = '';
    els.searchInput.value = '';
  }
}

function applyBackground(image) {
  els.backdrop.style.backgroundImage = image ? `url("${image}")` : '';
  els.root.classList.toggle('has-bg', Boolean(image));
}

function render() {
  if (dnd?.isDragging()) return;
  const state = getState();
  const focused = document.activeElement;
  const focusedTile = focused?.closest?.('.tile[data-id]')?.dataset.id;
  applyAppearance(state.settings);
  renderGroupsBar(state);
  renderBoard(state);
  if (focused && !focused.isConnected && focusedTile) {
    els.board.querySelector(`.tile[data-id="${CSS.escape(focusedTile)}"] .tile-link`)?.focus({ preventScroll: true });
  } else if (focused?.isConnected && focused !== document.activeElement) {
    focused.focus({ preventScroll: true });
  }
}

function menuPlacement(e, anchor) {
  return e && (e.clientX || e.clientY) ? { x: e.clientX, y: e.clientY } : { anchor };
}

function showTileMenu(id, placement) {
  const state = getState();
  const tile = actions.findTile(id);
  if (!tile) return;
  const others = state.groups.filter((g) => g.id !== tile.groupId);
  openMenu(
    [
      { icon: 'external', label: t('openNewTab'), action: () => actions.openUrl(tile.url, 'tab') },
      { icon: 'window', label: t('openNewWindow'), action: () => actions.openUrl(tile.url, 'window') },
      'separator',
      { icon: 'edit', label: t('edit'), hint: 'F2', action: () => openTileEditor({ tileId: id }) },
      others.length && 'separator',
      others.length && { heading: t('moveTo') },
      ...others.map((g) => ({ swatch: g.color, label: g.name, action: () => actions.moveTileToGroup(id, g.id) })),
      'separator',
      { icon: 'trash', label: t('delete'), hint: t('keyDelete'), danger: true, action: () => actions.deleteTile(id) },
    ],
    placement,
  );
}

function showGroupMenu(id, placement) {
  const count = actions.groupTiles(id).length;
  openMenu(
    [
      { icon: 'plus', label: t('addSite'), action: () => openTileEditor({ groupId: id }) },
      { icon: 'tabs', label: t('openAll', [String(count)]), disabled: !count, action: () => actions.openAll(id) },
      { icon: 'history', label: t('importTopSites'), action: () => actions.importTopSites(id) },
      'separator',
      { icon: 'edit', label: t('editGroup'), action: () => openGroupEditor(id) },
      {
        icon: 'trash',
        label: t('deleteGroup'),
        danger: true,
        disabled: getState().groups.length < 2,
        action: () => actions.deleteGroup(id),
      },
    ],
    placement,
  );
}

function openTileFromClick(e, link) {
  const tile = actions.findTile(link.closest('.tile').dataset.id);
  if (!tile) return;
  const background = e.ctrlKey || e.metaKey || e.button === 1;
  const newTab = background || e.shiftKey || getState().settings.openInNewTab;
  if (!newTab && !needsTabsApi(tile.url)) return;
  e.preventDefault();
  if (e.shiftKey && !background) actions.openUrl(tile.url, 'window');
  else actions.openUrl(tile.url, newTab ? 'tab' : 'current', !background);
}

function visibleLinks() {
  return [...els.board.querySelectorAll('.tile[data-id] .tile-link')];
}

function focusNeighbour(from, key) {
  const links = visibleLinks();
  const index = links.indexOf(from);
  if (index < 0) return;
  if (key === 'ArrowRight') return links[index + 1]?.focus();
  if (key === 'ArrowLeft') return links[index - 1]?.focus();
  const origin = from.getBoundingClientRect();
  const down = key === 'ArrowDown';
  const candidates = links.filter((link) => {
    const r = link.getBoundingClientRect();
    return down ? r.top >= origin.bottom : r.bottom <= origin.top;
  });
  if (!candidates.length) {
    if (!down && !els.search.hidden) els.searchInput.focus();
    return;
  }
  const tops = candidates.map((link) => link.getBoundingClientRect().top);
  const rowTop = down ? Math.min(...tops) : Math.max(...tops);
  const centre = origin.left + origin.width / 2;
  const row = candidates.filter((link) => link.getBoundingClientRect().top === rowTop);
  const distance = (link) => {
    const r = link.getBoundingClientRect();
    return Math.abs(r.left + r.width / 2 - centre);
  };
  row.reduce((best, link) => (distance(link) < distance(best) ? link : best)).focus();
}

function bindBoard() {
  document.addEventListener('click', (e) => {
    const actionEl = e.target.closest('[data-action]');
    if (actionEl) {
      const groupId = actionEl.dataset.group;
      switch (actionEl.dataset.action) {
        case 'add-tile':
          return openTileEditor({ groupId });
        case 'add-group':
          return openGroupEditor();
        case 'import-top':
          return actions.importTopSites(groupId);
        case 'toggle-section':
          return actions.toggleSection(groupId);
        case 'group-menu':
          return showGroupMenu(groupId, { anchor: actionEl });
        case 'tile-menu':
          return showTileMenu(actionEl.closest('.tile').dataset.id, { anchor: actionEl });
      }
    }
    const pill = e.target.closest('.pill[data-group-id]');
    if (pill) return actions.setActiveGroup(pill.dataset.groupId);
    const link = e.target.closest('.tile[data-id] .tile-link');
    if (link) openTileFromClick(e, link);
  });

  els.board.addEventListener('auxclick', (e) => {
    const link = e.target.closest('.tile[data-id] .tile-link');
    if (link && e.button === 1) openTileFromClick(e, link);
  });

  els.groups.addEventListener('dblclick', (e) => {
    const pill = e.target.closest('.pill[data-group-id]');
    if (pill) openGroupEditor(pill.dataset.groupId);
  });

  els.groups.addEventListener('keydown', (e) => {
    const pills = [...els.groups.querySelectorAll('.pill[data-group-id]')];
    const index = pills.indexOf(document.activeElement);
    if (index < 0) return;
    const steps = { ArrowRight: index + 1, ArrowLeft: index - 1, Home: 0, End: pills.length - 1 };
    if (e.key in steps) {
      e.preventDefault();
      const next = pills[(steps[e.key] + pills.length) % pills.length];
      actions.setActiveGroup(next.dataset.groupId);
      next.focus();
    } else if (e.key === 'F2') {
      e.preventDefault();
      openGroupEditor(pills[index].dataset.groupId);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      visibleLinks()[0]?.focus();
    }
  });

  document.addEventListener('contextmenu', (e) => {
    if (e.target.closest('dialog, input, textarea')) return;
    const tileEl = e.target.closest('.tile[data-id]');
    const groupEl = e.target.closest('[data-group-id]');
    if (!tileEl && !groupEl) return;
    e.preventDefault();
    if (tileEl) showTileMenu(tileEl.dataset.id, menuPlacement(e, tileEl.querySelector('.tile-more')));
    else showGroupMenu(groupEl.dataset.groupId, menuPlacement(e, groupEl));
  });

  els.board.addEventListener('keydown', (e) => {
    const link = e.target.closest('.tile[data-id] .tile-link');
    if (!link) return;
    const id = link.closest('.tile').dataset.id;
    const inResults = Boolean(link.closest('.results'));
    if (e.altKey && (e.key === 'ArrowLeft' || e.key === 'ArrowRight') && !inResults) {
      e.preventDefault();
      actions.nudgeTile(id, e.key === 'ArrowLeft' ? -1 : 1);
    } else if (!e.altKey && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
      e.preventDefault();
      focusNeighbour(link, e.key);
    } else if (e.key === 'F2') {
      e.preventDefault();
      openTileEditor({ tileId: id });
    } else if (e.key === 'Delete') {
      e.preventDefault();
      const links = visibleLinks();
      const neighbour = links[links.indexOf(link) + 1] ?? links[links.indexOf(link) - 1];
      actions.deleteTile(id);
      neighbour?.focus();
    }
  });
}

function bindSearch() {
  const setQuery = (value) => {
    query = value.trim();
    els.search.classList.toggle('has-query', Boolean(query));
    renderGroupsBar(getState());
    renderBoard(getState());
  };
  els.searchInput.addEventListener('input', () => setQuery(els.searchInput.value));
  els.searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && els.searchInput.value) {
      e.preventDefault();
      els.searchInput.value = '';
      setQuery('');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      visibleLinks()[0]?.focus();
    }
  });
  els.search.addEventListener('submit', (e) => {
    e.preventDefault();
    if (query) chrome.search.query({ text: query, disposition: 'CURRENT_TAB' });
  });
  document.addEventListener('keydown', (e) => {
    if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey || els.search.hidden) return;
    if (e.target.closest('input, textarea, select, [contenteditable], dialog')) return;
    e.preventDefault();
    els.searchInput.focus();
  });
}

async function dropImageOnTile(id, file) {
  if (!isImageFile(file)) return;
  actions.setTileImage(id, await resizeImage(file, ICON_MAX_PX, ICON_QUALITY));
}

async function init() {
  applyI18n(document);
  hydrateIcons(document);
  applyCredits(document);
  initMenu();
  initDialogs();
  initPro();
  bindBoard();
  bindSearch();
  document.getElementById('settings-btn').addEventListener('click', openSettings);

  dnd = initDnd({
    board: els.board,
    groupsBar: els.groups,
    callbacks: {
      canSpring: (groupId) => getState().settings.layout === 'tabs' && getState().settings.activeGroupId !== groupId,
      onSpring: (groupId, draggedEl) => {
        actions.setActiveGroup(groupId);
        renderGroupsBar(getState());
        const state = getState();
        const group = groupById(state, groupId);
        const grid = els.board.querySelector('.grid');
        const tiles = state.tiles.filter((x) => x.groupId === groupId).map((tile) => tileElement(tile, group, iconOptions(state)));
        grid.dataset.group = groupId;
        grid.setAttribute('aria-label', group.name);
        for (const el of [...grid.children]) if (el !== draggedEl) el.remove();
        grid.append(...tiles, renderAddTile(group));
        els.board.querySelector('.empty')?.remove();
      },
      onReorder: (groupId, ids) => actions.reorderGroup(groupId, ids),
      onMoveToGroup: (id, groupId) => actions.moveTileToGroup(id, groupId),
      onGroupsReorder: (ids) => actions.reorderGroups(ids),
      onLinkDrop: (groupId, url, title) => actions.addTileFromDrop(groupId, url, title),
      onImageDrop: dropImageOnTile,
      onSettle: render,
    },
  });

  await Promise.all([load(), loadLicense()]);
  render();
  onLicenseChange(render);
  subscribe(() => {
    render();
    expireToast(getVersion());
  });
  applyBackground(await getBackground());
  onBackgroundChange(applyBackground);
}

init();
