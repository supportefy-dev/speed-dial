// Records assets/readme/demo.gif from the real extension: loads this repository as an unpacked
// extension with Playwright, seeds demo data through chrome.storage.local, drives the actual UI
// (switch groups, switch layout, add a tile, drag a tile), and hands the frames to ffmpeg.
// Usage: node tools/readme-media/demo-gif.mjs
import { createRequire } from 'node:module';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_CORE || 'playwright-core');

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const CHROMIUM = process.env.CHROMIUM_PATH || undefined;
const OUTPUT = join(ROOT, 'assets', 'readme', 'demo.gif');
const WORK = mkdtempSync(join(tmpdir(), 'speed-dial-gif-'));
const PROFILE = join(WORK, 'profile');

// Demo data only: no personal data, no real accounts. Mirrors the free tier's 3-group limit.
const auto = { type: 'auto', src: '', fit: 'contain' };
const tile = (id, groupId, url, title, image = auto, color = '') => ({ id, groupId, url, title, color, image });
const DEMO = {
  version: 1,
  groups: [
    { id: 'work', name: 'Work', color: '#4f8ef7' },
    { id: 'dev', name: 'Dev', color: '#a06cf0' },
    { id: 'media', name: 'Media', color: '#f2555a' },
  ],
  tiles: [
    tile('w1', 'work', 'https://mail.google.com/', 'Gmail'),
    tile('w2', 'work', 'https://calendar.google.com/', 'Calendar'),
    tile('w3', 'work', 'https://drive.google.com/', 'Drive'),
    tile('w4', 'work', 'https://www.notion.so/', 'Notion'),
    tile('w5', 'work', 'https://www.figma.com/', 'Figma'),
    tile('w6', 'work', 'https://trello.com/', 'Trello'),
    tile('d1', 'dev', 'https://github.com/', 'GitHub'),
    tile('d2', 'dev', 'https://stackoverflow.com/', 'Stack Overflow'),
    tile('d3', 'dev', 'https://developer.mozilla.org/', 'MDN'),
    tile('d4', 'dev', 'https://www.npmjs.com/', 'npm'),
    tile('d5', 'dev', 'https://news.ycombinator.com/', 'Hacker News', { type: 'letter', src: '', fit: 'contain' }, '#f5a524'),
    tile('m1', 'media', 'https://www.youtube.com/', 'YouTube'),
    tile('m2', 'media', 'https://open.spotify.com/', 'Spotify'),
    tile('m3', 'media', 'https://www.reddit.com/', 'Reddit'),
    tile('m4', 'media', 'https://en.wikipedia.org/', 'Wikipedia'),
  ],
  settings: {
    theme: 'dark', layout: 'tabs', tileSize: 'm', maxColumns: 7, showTitles: true, showSearch: true,
    openInNewTab: false, remoteIcons: true, backgroundDim: 0.4, activeGroupId: 'work', collapsed: [],
  },
};

const frames = [];
let frameIndex = 0;
async function capture(page, seconds) {
  const file = join(WORK, `frame-${String(frameIndex).padStart(3, '0')}.png`);
  frameIndex += 1;
  await page.screenshot({ path: file });
  frames.push({ file, seconds });
}

const ctx = await chromium.launchPersistentContext(PROFILE, {
  executablePath: CHROMIUM,
  channel: 'chromium',
  headless: true,
  viewport: { width: 900, height: 600 },
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

  const seed = (data) => page.evaluate((value) => chrome.storage.local.set({ speedDial: value }), data);
  const settle = (ms) => page.waitForTimeout(ms);
  const rectOf = (selector) => page.evaluate((sel) => {
    const box = document.querySelector(sel).getBoundingClientRect();
    return { x: box.x, y: box.y, width: box.width, height: box.height };
  }, selector);
  const centerOf = (rect) => ({ x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 });

  // 1. Load with the Work group active, tabs layout.
  await seed(DEMO);
  await settle(900);
  await capture(page, 1.3);

  // 2. Switch groups: Work -> Dev -> Media.
  await page.click('.pill[data-group-id="dev"]');
  await settle(500);
  await capture(page, 0.9);
  await page.click('.pill[data-group-id="media"]');
  await settle(500);
  await capture(page, 0.9);
  await page.click('.pill[data-group-id="work"]');
  await settle(400);
  await capture(page, 0.6);

  // 3. Switch layout: tabs -> sections, through the real Settings panel.
  await page.click('#settings-btn');
  await settle(500);
  await capture(page, 0.7);
  await page.check('input[name="layout"][value="sections"]');
  await settle(600);
  await capture(page, 1.3);
  await page.check('input[name="layout"][value="tabs"]');
  await page.keyboard.press('Escape');
  await settle(500);
  await capture(page, 0.6);

  // 4. Add a tile through the real dialog.
  await page.click('.tile-add');
  await page.waitForSelector('#tile-dialog[open]');
  await settle(400);
  await capture(page, 0.7);
  await page.fill('#tile-form input[name="url"]', 'https://linear.app/');
  await page.fill('#tile-form input[name="title"]', 'Linear');
  await settle(200);
  await capture(page, 0.8);
  await page.click('#tile-form button[type="submit"]');
  await settle(600);
  await capture(page, 1.1);

  // 5. Drag a tile to reorder it within the group.
  const source = await rectOf('.tile[data-id="w2"]');
  const target = await rectOf('.tile[data-id="w5"]');
  const from = centerOf(source);
  const to = centerOf(target);
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await settle(150);
  await capture(page, 0.35);
  const steps = 6;
  for (let step = 1; step <= steps; step += 1) {
    const x = from.x + ((to.x - from.x) * step) / steps;
    const y = from.y + ((to.y - from.y) * step) / steps;
    await page.mouse.move(x, y, { steps: 3 });
    await settle(90);
    await capture(page, 0.28);
  }
  await page.mouse.up();
  await settle(500);
  await capture(page, 1.6);
} finally {
  await ctx.close();
}

const list = frames.map((frame) => `file '${frame.file.replace(/\\/g, '/')}'\nduration ${frame.seconds}`).join('\n');
const listFile = join(WORK, 'frames.txt');
writeFileSync(listFile, `${list}\nfile '${frames.at(-1).file.replace(/\\/g, '/')}'\n`);

const encode = spawnSync('ffmpeg', [
  '-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', listFile,
  '-vf', 'scale=460:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=96:stats_mode=diff[p];[b][p]paletteuse=dither=sierra2_4a:diff_mode=rectangle',
  '-loop', '0', OUTPUT,
], { stdio: 'inherit' });
if (encode.status !== 0) throw new Error('ffmpeg failed');
console.log(`wrote ${OUTPUT} from ${frames.length} frames`);

rmSync(WORK, { recursive: true, force: true, maxRetries: 5, retryDelay: 500 });
