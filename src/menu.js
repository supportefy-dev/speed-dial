import { h, icon } from './dom.js';
import { MENU_OFFSET_PX, VIEWPORT_MARGIN_PX } from './config.js';

const menuEl = () => document.getElementById('menu');
let returnFocus = null;
let anchorEl = null;

const clamp = (value, min, max) => Math.min(Math.max(value, min), Math.max(min, max));

function close({ restore }) {
  const el = menuEl();
  if (el.matches(':popover-open')) el.hidePopover();
  if (restore && returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
}

function renderItem(item) {
  if (item === 'separator') return h('div', { class: 'menu-sep', role: 'separator' });
  if (item.heading) return h('div', { class: 'menu-heading', role: 'presentation' }, item.heading);
  return h(
    'button',
    {
      type: 'button',
      role: 'menuitem',
      tabindex: '-1',
      class: `menu-item${item.danger ? ' danger' : ''}`,
      disabled: item.disabled,
      onclick: () => {
        close({ restore: false });
        item.action();
      },
    },
    item.swatch ? h('span', { class: 'dot', style: { '--accent': item.swatch } }) : icon(item.icon),
    h('span', { class: 'menu-label' }, item.label),
    item.hint && h('kbd', {}, item.hint),
  );
}

function position(el, { x, y, anchor }) {
  const { width, height } = el.getBoundingClientRect();
  const maxLeft = innerWidth - width - VIEWPORT_MARGIN_PX;
  const maxTop = innerHeight - height - VIEWPORT_MARGIN_PX;
  let left = x;
  let top = y;
  if (anchor) {
    const r = anchor.getBoundingClientRect();
    left = r.right - width;
    top = r.bottom + MENU_OFFSET_PX;
    if (top > maxTop) top = r.top - height - MENU_OFFSET_PX;
  } else {
    if (left > maxLeft) left = x - width;
    if (top > maxTop) top = y - height;
  }
  el.style.left = `${clamp(left, VIEWPORT_MARGIN_PX, maxLeft)}px`;
  el.style.top = `${clamp(top, VIEWPORT_MARGIN_PX, maxTop)}px`;
}

export function openMenu(items, placement) {
  const el = menuEl();
  close({ restore: false });
  returnFocus = document.activeElement;
  anchorEl = placement.anchor ?? null;
  const cleaned = items.filter(Boolean).filter((item, i, list) => item !== 'separator' || (i > 0 && list[i - 1] !== 'separator'));
  el.replaceChildren(...cleaned.map(renderItem));
  el.style.left = '0px';
  el.style.top = '0px';
  el.showPopover();
  position(el, placement);
  anchorEl?.setAttribute('aria-expanded', 'true');
  el.querySelector('.menu-item:not([disabled])')?.focus();
}

function moveFocus(el, step) {
  const items = [...el.querySelectorAll('.menu-item:not([disabled])')];
  if (!items.length) return;
  const index = items.indexOf(document.activeElement);
  const next = step === 'first' ? 0 : step === 'last' ? items.length - 1 : (index + step + items.length) % items.length;
  items[next].focus();
}

export function initMenu() {
  const el = menuEl();
  el.addEventListener('keydown', (e) => {
    const keys = { ArrowDown: 1, ArrowUp: -1, Home: 'first', End: 'last' };
    if (e.key in keys) {
      e.preventDefault();
      moveFocus(el, keys[e.key]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      close({ restore: true });
    } else if (e.key === 'Tab') {
      e.preventDefault();
      close({ restore: true });
    }
  });
  el.addEventListener('toggle', (e) => {
    if (e.newState === 'closed') anchorEl?.setAttribute('aria-expanded', 'false');
  });
  addEventListener('resize', () => close({ restore: false }));
  addEventListener('blur', () => close({ restore: false }));
}
