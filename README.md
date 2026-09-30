# Speed Dial

A Chrome new tab replacement: grouped, coloured speed dial tiles with your own titles and images.

## Install (unpacked)

1. Open `chrome://extensions` and switch on **Developer mode** (top right).
2. Click **Load unpacked** and pick this folder (the one with `manifest.json`).
3. Open a new tab. Chrome asks whether to keep the changed new tab page: choose **Keep it**.

After editing any file, press the reload icon on the extension card in `chrome://extensions`.

## Using it

| Do this | How |
|---|---|
| Add a site | The dashed **+** tile, the toolbar button (adds the current page), right-click any page or link > **Add to Speed Dial**, or drag a link from the bookmarks bar onto the grid |
| Edit title, address, group, image, colour | Hover a tile > **...** > **Edit**, right-click the tile, or focus it and press `F2` |
| Tile image | **Site icon** (automatic), **Upload** (choose, drop or paste), **Link** (image URL) or **Letter**. Dropping an image file straight onto a tile also sets it |
| Reorder | Drag tiles. `Alt + Left/Right` moves the focused tile |
| Move to another group | Drag onto a group tab (hover a moment to open that group and place it exactly), or **Move to** in the tile menu |
| Groups | **+** next to the group tabs creates one. Double-click a tab (or right-click > **Edit group**) to rename and recolour. Drag tabs to reorder |
| Layout | Settings > Groups: **Tabs** (one group at a time) or **Sections** (all groups stacked, collapsible) |
| Search | Typing filters your saved sites across all groups. `Enter` searches the web with your default engine. `/` focuses the box |
| Undo | Deletes, moves, imports and restores show an **Undo** toast |

Settings also cover theme, tile size, tiles per row, titles, a background image with dimming, and opening sites in a new tab.

## Your data

Everything is stored locally in `chrome.storage.local` (with `unlimitedStorage`, so uploaded images have room). Settings > **Export backup** writes one JSON file with every group, tile, image and the background; **Restore from backup** loads it on another machine.

Chrome does not let extensions read the shortcuts on Google's own new tab page. Use Settings > **Import most visited sites**, or add them with the toolbar button while visiting each site.

## Privacy

Site icons come from Chrome's local favicon cache. For sites Chrome has no icon for yet, the extension asks Google's favicon service, sending only the site's origin. Turn that off in Settings > **Fetch missing site icons**; those tiles then show a letter.

## Permissions

| Permission | Why |
|---|---|
| `storage`, `unlimitedStorage` | Save groups, tiles, uploaded images and the background |
| `favicon` | Read site icons from Chrome's cache |
| `topSites` | Import most visited sites |
| `search` | Send the search box to your default search engine |
| `contextMenus` | "Add to Speed Dial" on the right-click menu |
| `activeTab` | Read the current tab's address and title when you click the toolbar button |

## Development

- No build step: plain ES modules under `src/`.
- Strings live in `_locales/en/messages.json`; tunables live in `src/config.js`.
- `python tools/make_icons.py` regenerates `icons/`.
