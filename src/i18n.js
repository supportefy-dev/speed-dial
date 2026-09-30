export const t = (key, substitutions) => chrome.i18n.getMessage(key, substitutions) || key;

const ATTRIBUTE_BINDINGS = [
  ['i18nAria', 'aria-label'],
  ['i18nPlaceholder', 'placeholder'],
  ['i18nTitle', 'title'],
];

export function applyI18n(root) {
  for (const el of root.querySelectorAll('[data-i18n]')) el.textContent = t(el.dataset.i18n);
  for (const [dataKey, attribute] of ATTRIBUTE_BINDINGS) {
    const selector = `[data-${dataKey.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}]`;
    for (const el of root.querySelectorAll(selector)) el.setAttribute(attribute, t(el.dataset[dataKey]));
  }
}
