import { PRO, LICENSE_STORAGE_KEY } from './config.js';

const SIGNATURE_BYTES = 64;
const FREE = Object.freeze({ pro: false, email: '', issued: '', text: '' });

const base64ToBytes = (text) => Uint8Array.from(atob(text), (c) => c.charCodeAt(0));
const base64UrlToBytes = (text) => base64ToBytes(text.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(text.length / 4) * 4, '='));

let publicKeyPromise = null;
const publicKey = () =>
  (publicKeyPromise ??= crypto.subtle.importKey('spki', base64ToBytes(PRO.publicKey), { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']));

// Keys are signed offline by the seller; WebCrypto ECDSA expects the raw r||s signature.
export async function verifyLicense(input) {
  const text = String(input ?? '').replace(/\s+/g, '');
  if (!text.startsWith(PRO.keyPrefix)) return { ok: false, reason: 'format' };
  const parts = text.slice(PRO.keyPrefix.length).split('.');
  if (parts.length !== 2 || !parts[0] || !parts[1]) return { ok: false, reason: 'format' };
  let body;
  let signature;
  try {
    body = base64UrlToBytes(parts[0]);
    signature = base64UrlToBytes(parts[1]);
  } catch {
    return { ok: false, reason: 'format' };
  }
  if (signature.length !== SIGNATURE_BYTES) return { ok: false, reason: 'format' };
  const valid = await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, await publicKey(), signature, body);
  if (!valid) return { ok: false, reason: 'signature' };
  let payload;
  try {
    payload = JSON.parse(new TextDecoder().decode(body));
  } catch {
    return { ok: false, reason: 'format' };
  }
  if (payload?.v !== PRO.formatVersion || payload.p !== PRO.product) return { ok: false, reason: 'product' };
  return { ok: true, text, email: String(payload.e ?? ''), issued: String(payload.i ?? '') };
}

let status = FREE;
const listeners = new Set();

export const licenseStatus = () => status;
export const isPro = () => status.pro;

function setStatus(next) {
  status = next;
  for (const listener of listeners) listener(status);
}

export function onLicenseChange(listener) {
  listeners.add(listener);
}

async function statusFrom(stored) {
  if (!stored) return FREE;
  const result = await verifyLicense(stored);
  return result.ok ? { pro: true, email: result.email, issued: result.issued, text: result.text } : FREE;
}

export async function loadLicense() {
  const { [LICENSE_STORAGE_KEY]: stored } = await chrome.storage.local.get(LICENSE_STORAGE_KEY);
  setStatus(await statusFrom(stored));
  return status;
}

export async function activateLicense(input) {
  const result = await verifyLicense(input);
  if (!result.ok) return result;
  await chrome.storage.local.set({ [LICENSE_STORAGE_KEY]: result.text });
  setStatus({ pro: true, email: result.email, issued: result.issued, text: result.text });
  return result;
}

export async function removeLicense() {
  await chrome.storage.local.remove(LICENSE_STORAGE_KEY);
  setStatus(FREE);
}

export function proOffer(now = new Date()) {
  const launch = now < new Date(PRO.launchEnds);
  const amount = launch ? PRO.launchPrice : PRO.price;
  const format = (value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: PRO.currency }).format(value);
  return {
    launch,
    price: format(amount),
    regular: format(PRO.price),
    url: `${PRO.paypalMe}/${amount.toFixed(2)}${PRO.currency}`,
  };
}

export const canAddGroup = (groupCount) => status.pro || groupCount < PRO.freeGroupLimit;

if (globalThis.chrome?.storage?.onChanged) {
  chrome.storage.onChanged.addListener(async (changes, area) => {
    if (area !== 'local' || !(LICENSE_STORAGE_KEY in changes)) return;
    setStatus(await statusFrom(changes[LICENSE_STORAGE_KEY].newValue));
  });
}
