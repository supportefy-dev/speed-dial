// Captures the Chrome Web Store screenshots (1280x800) and the README gallery from the real
// extension with demo data. Usage: node tools/readme-media/store-screenshots.mjs
import { createRequire } from 'node:module';
import { mkdtempSync, rmSync, copyFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { DEMO } from './demo-data.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_CORE || 'playwright-core');

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const CHROMIUM = process.env.CHROMIUM_PATH || undefined;
const STORE_DIR = join(ROOT, 'assets', 'media-pack', 'chrome-web-store');
const CAPTURE_DIR = join(ROOT, 'assets', 'media-pack', 'source', 'captures');
const README_DIR = join(ROOT, 'docs', 'screenshots');
const WORK = mkdtempSync(join(tmpdir(), 'speed-dial-store-'));
const VIEWPORT = { width: 1440, height: 900 };
const STORE_SIZE = { width: 1280, height: 800 };
const SETTLE_MS = 1800;
const AFTER_LAUNCH = '2026-12-01T12:00:00Z';

function toStore(source, name, cropTop = 0) {
  const crop = `crop=${VIEWPORT.width}:${VIEWPORT.height}:0:${cropTop}`;
  const scale = `scale=${STORE_SIZE.width}:${STORE_SIZE.height}:flags=lanczos`;
  const result = spawnSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', source, '-vf', `${crop},${scale}`, join(STORE_DIR, name)]);
  if (result.status !== 0) throw new Error(`ffmpeg failed for ${name}: ${result.stderr}`);
}

function keep(source, name) {
  copyFileSync(source, join(CAPTURE_DIR, name));
  copyFileSync(source, join(README_DIR, name));
}

mkdirSync(STORE_DIR, { recursive: true });
mkdirSync(CAPTURE_DIR, { recursive: true });

const ctx = await chromium.launchPersistentContext(join(WORK, 'profile'), {
  executablePath: CHROMIUM,
  channel: 'chromium',
  headless: true,
  viewport: VIEWPORT,
  colorScheme: 'dark',
  args: [`--disable-extensions-except=${ROOT}`, `--load-extension=${ROOT}`],
});

try {
  let sw = ctx.serviceWorkers()[0];
  sw ??= await ctx.waitForEvent('serviceworker');
  const base = `chrome-extension://${new URL(sw.url()).host}/src`;
  const page = await ctx.newPage();
  await page.goto(`${base}/newtab.html`);
  await page.waitForSelector('.tile-add');

  const seed = (patch = {}) =>
    page.evaluate((data) => chrome.storage.local.set({ speedDial: data }), { ...DEMO, settings: { ...DEMO.settings, ...patch } });
  const settle = (ms = SETTLE_MS) => page.waitForTimeout(ms);
  const shot = async (name, options = {}) => {
    const file = join(WORK, name);
    await page.mouse.move(0, 0);
    await page.screenshot({ path: file, ...options });
    return file;
  };

  await seed({ theme: 'dark', layout: 'tabs', activeGroupId: 'work' });
  await settle(2600);
  const tabsDark = await shot('tabs-dark.png');
  keep(tabsDark, 'tabs-dark.png');
  toStore(tabsDark, 'screenshot-02-tabs-dark-1280x800.png');

  await page.click('.pill[data-group-id="dev"]');
  await settle();
  await page.click('.tile[data-id="d2"]', { button: 'right', position: { x: 70, y: 40 } });
  await settle(500);
  const menu = await shot('tile-menu.png');
  keep(menu, 'tile-menu.png');
  toStore(menu, 'screenshot-05-tile-menu-1280x800.png');
  await page.keyboard.press('Escape');

  await page.focus('.tile[data-id="d5"] .tile-link');
  await page.keyboard.press('F2');
  await page.waitForSelector('#tile-dialog[open]');
  await page.keyboard.press('End');
  await settle(600);
  const editor = await shot('tile-editor.png');
  keep(editor, 'tile-editor.png');
  toStore(editor, 'screenshot-03-tile-editor-1280x800.png');
  await page.keyboard.press('Escape');

  await page.click('.pill[data-group-id="work"]');
  await settle(800);
  // Store screenshots outlive the launch discount, so show the regular price.
  await page.clock.setFixedTime(new Date(AFTER_LAUNCH));
  await page.click('.pill-add');
  await page.waitForSelector('#pro-dialog[open]');
  await settle(600);
  const pro = await shot('pro-dialog.png');
  copyFileSync(pro, join(CAPTURE_DIR, 'pro-dialog.png'));
  toStore(pro, 'screenshot-06-pro-1280x800.png');
  await page.keyboard.press('Escape');

  await page.click('#settings-btn');
  await settle(800);
  const settings = await shot('settings.png');
  keep(settings, 'settings.png');
  toStore(settings, 'screenshot-04-settings-1280x800.png');
  await page.keyboard.press('Escape');

  await seed({ theme: 'light', layout: 'sections' });
  await page.emulateMedia({ colorScheme: 'light' });
  await settle(2000);
  const sections = await shot('sections-light.png', { fullPage: true });
  keep(sections, 'sections-light.png');
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  const searchTop = await page.evaluate(() => Math.round(document.querySelector('.search').getBoundingClientRect().top + scrollY));
  const cropTop = Math.max(0, Math.min(height - VIEWPORT.height, searchTop - 40));
  toStore(sections, 'screenshot-01-sections-light-1280x800.png', cropTop);

  await page.setViewportSize({ width: 390, height: 844 });
  await settle(900);
  const narrow = await shot('narrow.png', { fullPage: true });
  keep(narrow, 'narrow.png');
} finally {
  await ctx.close();
  rmSync(WORK, { recursive: true, force: true });
}
console.log('store screenshots and README captures written');
