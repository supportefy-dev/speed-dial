import { h, leave } from './dom.js';
import { t } from './i18n.js';
import { UNDO_MS } from './config.js';

let current = null;

export function dismissToast() {
  if (!current) return;
  clearTimeout(current.timer);
  leave(current.el);
  current = null;
}

export function expireToast(version) {
  if (current?.version != null && current.version !== version) dismissToast();
}

export function showToast(message, { undo, version } = {}) {
  dismissToast();
  const action =
    undo &&
    h(
      'button',
      {
        type: 'button',
        class: 'toast-action',
        onclick: () => {
          dismissToast();
          undo();
        },
      },
      t('undo'),
    );
  const el = h('div', { class: 'toast', role: 'status' }, h('span', { class: 'toast-message' }, message), action);
  const entry = { el, version, timer: setTimeout(dismissToast, UNDO_MS) };
  el.addEventListener('mouseenter', () => clearTimeout(entry.timer));
  el.addEventListener('mouseleave', () => {
    entry.timer = setTimeout(dismissToast, UNDO_MS);
  });
  document.getElementById('toasts').append(el);
  current = entry;
}
