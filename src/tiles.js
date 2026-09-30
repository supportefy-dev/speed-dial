import { h, icon } from './dom.js';
import { t } from './i18n.js';
import { faviconUrl, remoteFaviconUrl, isGenericFavicon } from './favicon.js';
import { tileLabel } from './urls.js';
import { readableTextOn } from './color.js';

export const tileSignature = (tile, group, options) => JSON.stringify([tile, group.color, options]);

let paintToken = 0;

function letterBadge(tile, color) {
  const glyph = [...tileLabel(tile)][0]?.toUpperCase() ?? '';
  if (!color) return h('span', { class: 'tile-letter soft' }, glyph);
  return h('span', { class: 'tile-letter', style: { '--letter-bg': color, '--letter-fg': readableTextOn(color) } }, glyph);
}

export function paintWell(well, tile, group, { remoteIcons = false } = {}) {
  const token = String(++paintToken);
  well.dataset.paint = token;
  const { type, src, fit } = tile.image;
  const solid = type === 'letter' ? tile.color || group.color : tile.color;
  const custom = type === 'upload' || type === 'url';
  const current = () => well.dataset.paint === token;
  well.classList.toggle('fill', custom && fit === 'cover');
  well.classList.remove('pending');
  const fallback = () => {
    if (!current()) return;
    well.classList.remove('fill', 'pending');
    well.replaceChildren(letterBadge(tile, solid));
  };
  if (type === 'letter' || !tile.url || (custom && !src)) return fallback();

  const img = h('img', { alt: '', draggable: 'false', decoding: 'async' });
  img.addEventListener('error', fallback);
  if (type === 'auto') {
    const remote = remoteIcons ? remoteFaviconUrl(tile.url) : null;
    well.classList.add('pending');
    img.className = 'favicon';
    img.src = faviconUrl(tile.url);
    isGenericFavicon(tile.url)
      .then((generic) => {
        if (!generic || !current()) return;
        if (remote) img.src = remote;
        else fallback();
      })
      .catch(fallback)
      .finally(() => current() && well.classList.remove('pending'));
  } else {
    img.src = src;
  }
  well.replaceChildren(img);
}

export function renderTile(tile, group, { interactive = true, ...paintOptions } = {}) {
  const label = tileLabel(tile);
  const well = h('span', { class: 'tile-well' });
  paintWell(well, tile, group, paintOptions);
  const title = h('span', { class: 'tile-title' }, label);

  if (!interactive) {
    return h(
      'div',
      { class: 'tile is-preview', 'aria-hidden': 'true', style: { '--accent': group.color } },
      h('span', { class: 'tile-link' }, well, title),
    );
  }

  const link = h('a', { class: 'tile-link', href: tile.url, draggable: 'false', title: `${label}\n${tile.url}` }, well, title);
  const more = h(
    'button',
    {
      type: 'button',
      class: 'tile-more',
      tabindex: '-1',
      'data-action': 'tile-menu',
      'aria-haspopup': 'menu',
      'aria-expanded': 'false',
      'aria-label': t('tileOptions', [label]),
    },
    icon('more'),
  );
  return h('div', { class: 'tile', draggable: 'true', 'data-id': tile.id, style: { '--accent': group.color } }, link, more);
}

export function renderAddTile(group) {
  return h(
    'button',
    {
      type: 'button',
      class: 'tile tile-add',
      'data-action': 'add-tile',
      'data-group': group.id,
      'aria-label': t('addSiteTo', [group.name]),
      style: { '--accent': group.color },
    },
    h('span', { class: 'tile-link' }, h('span', { class: 'tile-well' }, icon('plus')), h('span', { class: 'tile-title' }, t('addSite'))),
  );
}
