import { flip } from './dom.js';
import { SPRING_LOAD_MS } from './config.js';

const TILE_TYPE = 'application/x-speed-dial-tile';
const GROUP_TYPE = 'application/x-speed-dial-group';

let drag = null;
let springTimer = null;
let springTarget = null;

const hasType = (e, type) => e.dataTransfer?.types.includes(type);
const isExternalLink = (e) => hasType(e, 'text/uri-list') && !hasType(e, TILE_TYPE) && !hasType(e, GROUP_TYPE);
const isFileDrag = (e) => hasType(e, 'Files');

function clearHighlights() {
  for (const el of document.querySelectorAll('.drop-hover, .drop-target')) el.classList.remove('drop-hover', 'drop-target');
}

function cancelSpring() {
  clearTimeout(springTimer);
  springTimer = null;
  springTarget = null;
}

function containsPoint(rect, x, y) {
  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
}

function placeAmong(container, items, el, x, y, axis, animateRoot) {
  const others = items.filter((item) => item !== el);
  const target = others.find((item) => containsPoint(item.getBoundingClientRect(), x, y));
  let reference;
  if (target) {
    const r = target.getBoundingClientRect();
    const after = axis === 'x' ? x > r.left + r.width / 2 : y > r.top + r.height / 2;
    reference = after ? target.nextElementSibling : target;
  } else if (others.length) {
    const last = others.at(-1);
    const lr = last.getBoundingClientRect();
    const beyond = y > lr.bottom || (y >= lr.top && x > lr.right);
    if (!beyond) return;
    reference = last.nextElementSibling;
  } else {
    reference = container.firstElementChild;
  }
  if (reference === el || (reference === el.nextElementSibling && el.parentElement === container)) return;
  flip(animateRoot, () => container.insertBefore(el, reference));
}

function linkFromTransfer(dataTransfer) {
  const url = dataTransfer
    .getData('text/uri-list')
    .split(/\r?\n/)
    .find((line) => line && !line.startsWith('#'));
  const html = dataTransfer.getData('text/html');
  const title = html ? new DOMParser().parseFromString(html, 'text/html').querySelector('a')?.textContent?.trim() : '';
  return { url, title: title ?? '' };
}

export function initDnd({ board, groupsBar, callbacks }) {
  const tileItems = (grid) => [...grid.querySelectorAll(':scope > .tile[data-id]')];

  document.addEventListener('dragstart', (e) => {
    const tileEl = e.target.closest?.('.tile[data-id]');
    const groupEl = e.target.closest?.('[data-drag-group]');
    if (tileEl && !tileEl.closest('.results')) {
      drag = { kind: 'tile', id: tileEl.dataset.id, el: tileEl, dropped: false };
      const url = tileEl.querySelector('.tile-link').href;
      e.dataTransfer.effectAllowed = 'copyMove';
      e.dataTransfer.setData(TILE_TYPE, drag.id);
      e.dataTransfer.setData('text/uri-list', url);
      e.dataTransfer.setData('text/plain', url);
      const well = tileEl.querySelector('.tile-well');
      e.dataTransfer.setDragImage(well, well.offsetWidth / 2, well.offsetHeight / 2);
    } else if (groupEl) {
      const el = groupEl.closest('[data-group-id]');
      drag = { kind: 'group', id: el.dataset.groupId, el, dropped: false };
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData(GROUP_TYPE, drag.id);
    } else {
      return;
    }
    requestAnimationFrame(() => {
      drag?.el.classList.add('dragging');
      document.body.classList.add('is-dragging');
    });
  });

  document.addEventListener('dragover', (e) => {
    if (isFileDrag(e)) {
      e.preventDefault();
      const tileEl = e.target.closest('.tile[data-id]');
      clearHighlights();
      tileEl?.classList.add('drop-target');
      e.dataTransfer.dropEffect = tileEl ? 'copy' : 'none';
      return;
    }

    const groupTarget = e.target.closest('[data-drop-group]');

    if (drag?.kind === 'group') {
      const container = drag.el.parentElement;
      const items = [...container.querySelectorAll(':scope > [data-group-id]')];
      if (!container.contains(e.target) && !drag.el.contains(e.target)) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      placeAmong(container, items, drag.el, e.clientX, e.clientY, container === groupsBar ? 'x' : 'y', container);
      return;
    }

    if (drag?.kind === 'tile' && groupTarget && !groupTarget.closest('.grid')) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      if (!groupTarget.classList.contains('drop-hover')) {
        clearHighlights();
        groupTarget.classList.add('drop-hover');
      }
      const groupId = groupTarget.dataset.dropGroup;
      if (callbacks.canSpring(groupId) && springTarget !== groupId) {
        cancelSpring();
        springTarget = groupId;
        springTimer = setTimeout(() => {
          callbacks.onSpring(groupId, drag.el);
          cancelSpring();
          clearHighlights();
        }, SPRING_LOAD_MS);
      }
      return;
    }

    cancelSpring();
    const grid = e.target.closest('.grid:not(.results)');

    if (drag?.kind === 'tile') {
      document.querySelector('.drop-hover')?.classList.remove('drop-hover');
      if (!grid) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      placeAmong(grid, tileItems(grid), drag.el, e.clientX, e.clientY, 'x', board);
      return;
    }

    if (isExternalLink(e) && (grid || groupTarget)) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
      clearHighlights();
      (grid ?? groupTarget).classList.add(grid ? 'drop-target' : 'drop-hover');
    }
  });

  document.addEventListener('dragleave', (e) => {
    if (!e.relatedTarget) clearHighlights();
  });

  document.addEventListener('drop', (e) => {
    const files = isFileDrag(e) ? [...e.dataTransfer.files] : [];
    if (files.length || isFileDrag(e)) {
      e.preventDefault();
      const tileEl = e.target.closest('.tile[data-id]');
      clearHighlights();
      if (tileEl && files[0]) callbacks.onImageDrop(tileEl.dataset.id, files[0]);
      return;
    }

    const groupTarget = e.target.closest('[data-drop-group]');
    const grid = e.target.closest('.grid:not(.results)');

    if (drag?.kind === 'group') {
      e.preventDefault();
      drag.dropped = true;
      const ids = [...drag.el.parentElement.querySelectorAll(':scope > [data-group-id]')].map((el) => el.dataset.groupId);
      callbacks.onGroupsReorder(ids);
    } else if (drag?.kind === 'tile') {
      e.preventDefault();
      drag.dropped = true;
      if (groupTarget && !groupTarget.closest('.grid') && !grid) {
        callbacks.onMoveToGroup(drag.id, groupTarget.dataset.dropGroup);
      } else {
        const home = drag.el.closest('.grid');
        if (home) callbacks.onReorder(home.dataset.group, tileItems(home).map((el) => el.dataset.id));
      }
    } else if (isExternalLink(e)) {
      const groupId = grid?.dataset.group ?? groupTarget?.dataset.dropGroup;
      if (groupId) {
        e.preventDefault();
        const { url, title } = linkFromTransfer(e.dataTransfer);
        if (url) callbacks.onLinkDrop(groupId, url, title);
      }
    }
    clearHighlights();
  });

  document.addEventListener('dragend', () => {
    cancelSpring();
    clearHighlights();
    document.body.classList.remove('is-dragging');
    if (!drag) return;
    drag.el.classList.remove('dragging');
    drag = null;
    callbacks.onSettle();
  });

  return { isDragging: () => Boolean(drag) };
}
