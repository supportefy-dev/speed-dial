import { h, icon, bindModal } from './dom.js';
import { t } from './i18n.js';
import { getState } from './store.js';
import { showToast } from './toast.js';
import { licenseStatus, activateLicense, removeLicense, proOffer, onLicenseChange } from './license.js';
import { PRO, EARLY_BIRD } from './config.js';

const $ = (id) => document.getElementById(id);
const FEATURES_NOW = ['proFeatureGroups'];
const FEATURES_SOON = ['proFeatureSync', 'proFeatureBackups', 'proFeatureBookmarks', 'proFeaturePrivate', 'proFeatureStyle'];
const ERROR_KEYS = { format: 'proErrorFormat', signature: 'proErrorSignature', product: 'proErrorProduct' };

const dialog = $('pro-dialog');
const keyForm = $('pro-key-form');
const keyError = $('pro-key-error');

function fillList(list, keys, iconName) {
  list.replaceChildren(...keys.map((key) => h('li', {}, icon(iconName), h('span', {}, t(key)))));
}

function setKeyError(reason) {
  const key = reason && (ERROR_KEYS[reason] ?? ERROR_KEYS.format);
  keyError.hidden = !key;
  keyError.textContent = key ? t(key) : '';
  keyForm.elements.key.setAttribute('aria-invalid', String(Boolean(key)));
}

function earlyBirdMailto() {
  const params = new URLSearchParams({ subject: t('earlyBirdSubject'), body: t('earlyBirdBody') });
  return `mailto:${EARLY_BIRD.email}?${params.toString().replace(/\+/g, '%20')}`;
}

function reasonText(reason, groups) {
  if (reason === 'restore') return t('proReasonRestore', [String(groups), String(PRO.freeGroupLimit)]);
  return t('proReasonGroups', [String(PRO.freeGroupLimit)]);
}

function renderDialog(reason, groups) {
  const status = licenseStatus();
  const offer = proOffer();
  $('pro-offer').hidden = status.pro;
  $('pro-active').hidden = !status.pro;
  $('pro-reason').hidden = !reason || status.pro;
  if (reason) $('pro-reason').textContent = reasonText(reason, groups);

  if (status.pro) {
    $('pro-licensed').textContent = t('proLicensedTo', [status.email]);
    fillList($('pro-active-now'), FEATURES_NOW, 'check');
    fillList($('pro-active-soon'), FEATURES_SOON, 'star');
    return;
  }

  $('early-bird').hidden = !EARLY_BIRD.open;
  $('early-bird-title').textContent = t('earlyBirdTitle', [String(EARLY_BIRD.limit)]);
  $('early-bird-claim').href = earlyBirdMailto();
  $('early-bird-alt').textContent = t('earlyBirdAlt', [EARLY_BIRD.email, t('earlyBirdSubject')]);

  fillList($('pro-now'), FEATURES_NOW, 'check');
  fillList($('pro-soon'), FEATURES_SOON, 'star');
  $('pro-amount').textContent = offer.price;
  $('pro-regular').hidden = !offer.launch;
  $('pro-regular').textContent = offer.regular;
  $('pro-launch').hidden = !offer.launch;
  $('pro-launch').textContent = t('proLaunch', [new Date(PRO.launchEnds).toLocaleDateString(undefined, { month: 'long', day: 'numeric' })]);
  $('pro-buy').href = offer.url;
  $('pro-buy-label').textContent = t('proBuy', [offer.price]);
}

export function renderProSettings() {
  const status = licenseStatus();
  const groups = getState().groups.length;
  let text;
  if (status.pro) text = t('proStatusActive', [status.email]);
  else if (groups > PRO.freeGroupLimit) text = t('proStatusOver', [String(groups)]);
  else text = t('proStatusFree', [String(groups), String(PRO.freeGroupLimit)]);
  $('pro-status-text').textContent = text;
  $('pro-open-label').textContent = t(status.pro ? 'proManage' : 'proUpgrade');
}

export function openPro({ reason, groups } = {}) {
  renderDialog(reason, groups);
  setKeyError(null);
  keyForm.reset();
  if (!dialog.open) dialog.showModal();
  (licenseStatus().pro ? $('pro-remove') : $('pro-buy')).focus();
}

export function initPro() {
  bindModal(dialog);
  $('pro-open').addEventListener('click', () => {
    $('settings-dialog').close();
    openPro();
  });
  keyForm.addEventListener('input', () => setKeyError(null));
  keyForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const result = await activateLicense(keyForm.elements.key.value);
    if (!result.ok) {
      setKeyError(result.reason);
      keyForm.elements.key.focus();
      return;
    }
    dialog.close();
    showToast(t('toastProActivated'));
  });
  $('pro-remove').addEventListener('click', async () => {
    const { text } = licenseStatus();
    await removeLicense();
    dialog.close();
    showToast(t('toastProRemoved'), { undo: () => activateLicense(text) });
  });
  onLicenseChange(() => {
    if (dialog.open) renderDialog();
    renderProSettings();
  });
}
