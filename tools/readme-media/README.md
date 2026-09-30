# README media tools

Scripts that rebuild the README-only artwork in `assets/readme/`. Run them after the new tab page or the brand changes, then commit the regenerated files.

| Script | Builds | Needs |
| --- | --- | --- |
| `build_assets.py` | `banner-dark-1280x480.png` (from `assets/media-pack/source/readme-banner.svg`) and `how-it-works-light.png` / `how-it-works-dark.png` (using the icons in `assets/readme/icons/`) | Python 3, Chrome or Edge |
| `demo-gif.mjs` | `demo.gif`, recorded from the real new tab page with this repository loaded as an unpacked extension and demo-only data | Node 20+, Playwright Core, a Chromium build that allows `--load-extension` headless, `ffmpeg` on `PATH` |

```powershell
python tools/readme-media/build_assets.py
node tools/readme-media/demo-gif.mjs
```

`demo-gif.mjs` seeds `chrome.storage.local` under the `speedDial` key with a fixed set of demo groups and sites (Work, Dev, Media); it never touches real bookmarks or accounts. It resolves `playwright-core` normally (install it with `npm install --no-save playwright-core`), or from the path in the `PLAYWRIGHT_CORE` environment variable. It uses Playwright's own Chromium unless `CHROMIUM_PATH` points at another Chromium build; branded Chrome and Edge may refuse `--load-extension`.

The feature icons in `assets/readme/icons/` are hand-written SVGs; edit them directly.
