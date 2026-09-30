import { ICONS } from './icons.js';
import { MOTION_MS, MOTION_EASING } from './config.js';

export function h(tag, props = {}, ...children) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (value == null || value === false) continue;
    if (key === 'class') el.className = value;
    else if (key === 'style') for (const [prop, v] of Object.entries(value)) el.style.setProperty(prop, v);
    else if (key.startsWith('on') && typeof value === 'function') el.addEventListener(key.slice(2), value);
    else el.setAttribute(key, value === true ? '' : String(value));
  }
  el.append(...children.flat().filter((child) => child != null && child !== false));
  return el;
}

export function icon(name) {
  const span = document.createElement('span');
  span.className = 'icon';
  span.setAttribute('aria-hidden', 'true');
  span.innerHTML = ICONS[name] ?? '';
  return span;
}

export function hydrateIcons(root) {
  for (const el of root.querySelectorAll('[data-icon]')) el.prepend(icon(el.dataset.icon));
}

export const prefersReducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export function flip(root, mutate) {
  if (prefersReducedMotion()) return mutate();
  const before = new Map(
    [...root.querySelectorAll('[data-id], [data-group-id]')].map((el) => [el, el.getBoundingClientRect()]),
  );
  mutate();
  for (const [el, prev] of before) {
    if (!el.isConnected) continue;
    const now = el.getBoundingClientRect();
    const dx = prev.left - now.left;
    const dy = prev.top - now.top;
    if (!dx && !dy) continue;
    el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], {
      duration: MOTION_MS,
      easing: MOTION_EASING,
    });
  }
}

export function leave(el) {
  el.classList.add('leaving');
  const running = el.getAnimations();
  if (!running.length) return el.remove();
  Promise.all(running.map((a) => a.finished)).then(() => el.remove(), () => el.remove());
}

export function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}
