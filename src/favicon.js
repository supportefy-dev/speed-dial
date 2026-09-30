import { FAVICON_PX, FAVICON_PROBE_PX, FAVICON_PROBE_URL, REMOTE_FAVICON_URL, REMOTE_FAVICON_PX } from './config.js';

export const hasFaviconCache = () => chrome.runtime.getManifest().permissions?.includes('favicon') ?? false;

export function faviconUrl(pageUrl, size = FAVICON_PX) {
  const url = new URL(chrome.runtime.getURL('/_favicon/'));
  url.searchParams.set('pageUrl', pageUrl);
  url.searchParams.set('size', String(size));
  return url.href;
}

export function remoteFaviconUrl(pageUrl) {
  if (!/^https?:/i.test(pageUrl)) return null;
  const url = new URL(REMOTE_FAVICON_URL);
  url.searchParams.set('domain_url', new URL(pageUrl).origin);
  url.searchParams.set('sz', String(REMOTE_FAVICON_PX));
  return url.href;
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function fingerprint(pageUrl) {
  const img = await loadImage(faviconUrl(pageUrl));
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = FAVICON_PROBE_PX;
  canvas.getContext('2d').drawImage(img, 0, 0, FAVICON_PROBE_PX, FAVICON_PROBE_PX);
  return canvas.toDataURL();
}

let genericPrint = null;
const verdicts = new Map();

// Chrome returns a stock globe for pages it has never cached an icon for; comparing
// against the globe it serves for a non-existent host is the only way to detect that.
export function isGenericFavicon(pageUrl) {
  if (!verdicts.has(pageUrl)) {
    genericPrint ??= fingerprint(FAVICON_PROBE_URL);
    verdicts.set(
      pageUrl,
      Promise.all([genericPrint, fingerprint(pageUrl)]).then(([generic, own]) => generic === own),
    );
  }
  return verdicts.get(pageUrl);
}
