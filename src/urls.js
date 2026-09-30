import { ALLOWED_SCHEMES, TITLE_SEPARATORS, MIN_SHORT_TITLE } from './config.js';

function parse(text) {
  try {
    const url = new URL(text);
    return ALLOWED_SCHEMES.includes(url.protocol) ? url : null;
  } catch {
    return null;
  }
}

export function normalizeUrl(input) {
  const text = String(input ?? '').trim();
  if (!text || /\s/.test(text)) return null;
  const direct = /^[a-z][a-z0-9+.-]*:\/\//i.test(text) ? parse(text) : null;
  const url = direct ?? parse(`https://${text}`);
  if (!url) return null;
  if (url.protocol.startsWith('http') && !url.hostname) return null;
  return url.href;
}

export function hostLabel(url) {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, '') || parsed.href;
  } catch {
    return String(url ?? '');
  }
}

export const tileLabel = (tile) => tile.title.trim() || hostLabel(tile.url);

export const needsTabsApi = (url) => !/^https?:/i.test(url);

export function shortTitle(title) {
  const full = String(title ?? '').trim();
  const first = full.split(TITLE_SEPARATORS)[0].trim();
  return first.length >= MIN_SHORT_TITLE ? first : full;
}
