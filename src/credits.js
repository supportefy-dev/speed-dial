import { t } from './i18n.js';
import { DONATE_URL } from './config.js';

export function applyCredits(root) {
  const { version, homepage_url: homepage } = chrome.runtime.getManifest();
  for (const link of root.querySelectorAll('[data-credit]')) link.href = homepage;
  for (const link of root.querySelectorAll('[data-donate]')) link.href = DONATE_URL;
  for (const el of root.querySelectorAll('[data-version]')) el.textContent = t('versionLabel', [version]);
}
