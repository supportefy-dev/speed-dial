<div align="center">

<img src="icons/icon128.png" width="96" height="96" alt="Speed Dial icon">

# Speed Dial

**A fast, good-looking new tab page for Chrome, with groups, colours and your own tile images.**

![Manifest V3](https://img.shields.io/badge/Manifest-V3-4f8ef7)
![No build step](https://img.shields.io/badge/build-none-34c38f)
![Dependencies](https://img.shields.io/badge/dependencies-0-a06cf0)
![Version](https://img.shields.io/badge/version-1.0.0-f5a524)

<img src="docs/screenshots/tabs-dark.png" alt="Speed Dial in dark theme with the tabs layout" width="100%">

</div>

---

## Contents

- [Features](#features)
- [Screenshots](#screenshots)
- [Install](#install)
- [Using Speed Dial](#using-speed-dial)
- [Keyboard shortcuts](#keyboard-shortcuts)
- [Your data and privacy](#your-data-and-privacy)
- [Permissions](#permissions)
- [Project structure](#project-structure)
- [Development](#development)
- [Credits](#credits)

## Features

**Groups**
- As many groups as you need, each with its own colour: 8 presets or any custom colour
- Two layouts: **Tabs** (one group at a time) or **Sections** (every group stacked, each one collapsible)
- Rename, recolour, reorder by drag, open every site in a group at once, delete with undo

**Tiles**
- Custom address, title, group and colour for every tile
- Four image sources: **Site icon** (automatic), **Upload** (choose, drag in or paste), **Link** (an image URL) or **Letter**
- Uploaded images are resized and stored as WebP, so they stay small
- Drag to reorder, drag onto a group tab to move, or hover over a tab to open it and drop in an exact spot
- Drop an image file straight onto a tile to change its picture

**Adding sites**
- The dashed **+** tile in every group
- The toolbar button, which adds the page you are on
- Right-click any page or link and choose **Add to Speed Dial**
- Drag links in from the bookmarks bar
- Import your most visited sites in one click

**Everything else**
- The search box filters your saved sites across all groups as you type; `Enter` searches the web with your default search engine
- Dark, light or automatic theme, three tile sizes, a limit on tiles per row, optional titles
- Background image with adjustable dimming
- Undo for deletes, moves, imports and restores
- Full keyboard control and screen-reader labels
- Works from phone width up to ultra-wide
- Open tabs update straight away when you change something in another tab

## Screenshots

| Sections layout, light theme | Tile editor |
|---|---|
| ![Sections layout](docs/screenshots/sections-light.png) | ![Tile editor](docs/screenshots/tile-editor.png) |

| Tile menu | Settings |
|---|---|
| ![Tile menu](docs/screenshots/tile-menu.png) | ![Settings](docs/screenshots/settings.png) |

<p align="center"><img src="docs/screenshots/narrow.png" alt="Narrow window" width="260"></p>

## Install

Speed Dial is not on the Chrome Web Store yet. To load it directly:

1. Download or clone this repository.
   ```bash
   git clone https://github.com/supportefy-dev/speed-dial.git
   ```
2. Open `chrome://extensions` and switch on **Developer mode** (top right).
3. Click **Load unpacked** and select the cloned folder (the one containing `manifest.json`).
4. Open a new tab. Chrome asks whether to keep the changed new tab page: choose **Keep it**.

To update later, pull the latest changes and press the reload icon on the Speed Dial card in `chrome://extensions`.

Requires Chrome 116 or newer.

## Using Speed Dial

| To | Do this |
|---|---|
| Add a site | Click the dashed **+** tile, use the toolbar button, right-click a page or link, or drag a link onto the grid |
| Edit a site | Hover it and click **...**, right-click it, or focus it and press `F2` |
| Change a tile's picture | Edit the site and pick **Site icon**, **Upload**, **Link** or **Letter**, or drop an image file onto the tile |
| Reorder sites | Drag them, or press `Alt + Left/Right` on the focused tile |
| Move a site to another group | Drag it onto the group's tab, or use **Move to** in its menu |
| Create a group | The **+** after the group tabs, or **New group** at the bottom in Sections layout |
| Rename or recolour a group | Double-click its tab, or right-click and choose **Edit group** |
| Reorder groups | Drag the group tabs, or drag the section headers in Sections layout |
| Switch layout, theme, sizes | Open **Settings** (top right) |
| Undo | Click **Undo** on the notice at the bottom of the page |

> Chrome does not let extensions read the shortcuts on Google's own new tab page. Use **Settings > Import most visited sites**, or click the toolbar button on each site you want to keep.

## Keyboard shortcuts

| Keys | Action |
|---|---|
| `/` | Focus the search box |
| Arrow keys | Move between tiles |
| `Enter` | Open the focused site (or search the web from the search box) |
| `Ctrl + Enter`, middle click | Open in a background tab |
| `Shift + Enter` | Open in a new window |
| `F2` | Edit the focused site or group |
| `Delete` | Delete the focused site |
| `Alt + Left/Right` | Move the focused site |
| `Shift + F10` | Open the options menu |
| `Esc` | Clear the search, or close a menu or dialog |

## Your data and privacy

- Everything is stored locally in `chrome.storage.local`. Nothing is sent to any server run by this project.
- **Settings > Export backup** saves a single JSON file holding every group, tile, uploaded image and the background. **Restore from backup** loads it on another computer or browser, and the restore can be undone.
- Site icons come from Chrome's own favicon cache. For a site Chrome has no icon for yet, Speed Dial asks Google's favicon service, sending only that site's origin (for example `https://example.com`). Switch this off with **Settings > Fetch missing site icons**; those tiles then show a letter.

## Permissions

| Permission | Why it is needed |
|---|---|
| `storage`, `unlimitedStorage` | Save your groups, tiles, uploaded images and background |
| `favicon` | Read site icons from Chrome's local cache |
| `topSites` | Import your most visited sites |
| `search` | Send the search box to your default search engine |
| `contextMenus` | The **Add to Speed Dial** right-click entries |
| `activeTab` | Read the current page's address and title when you click the toolbar button |

Speed Dial asks for no host permissions and never reads the content of the pages you visit.

## Project structure

```
manifest.json            Extension manifest (MV3)
_locales/en/             Every user-facing string
icons/                   Toolbar and store icons
docs/screenshots/        Images used in this README
tools/make_icons.py      Regenerates icons/ (needs Pillow)
src/
  newtab.html/.css       The new tab page and its design tokens (light and dark)
  app.js                 Rendering, events and keyboard handling for the new tab page
  store.js               State, validation, persistence and cross-tab sync
  actions.js             Every change a user can make, with undo
  dialogs.js             Site editor, group editor and settings sheet
  dnd.js                 Drag and drop for tiles, groups, links and image files
  tiles.js               Tile rendering and the icon fallback chain
  favicon.js             Chrome favicon cache, remote icon lookup, generic-icon detection
  menu.js, toast.js      Context menu and undo notices
  popup.html/.js/.css    Toolbar popup for adding the current page
  background.js          Service worker: right-click menu entries and first-run setup
  config.js              Every tunable value in one place
```

## Development

- Plain ES modules with no build step and no dependencies. Edit a file, then reload the extension in `chrome://extensions`.
- Strings live in `_locales/en/messages.json`. To translate, add `_locales/<language>/messages.json` with the same keys.
- Sizes, colours, timings and limits live in `src/config.js`; visual tokens live at the top of `src/newtab.css`.
- `python tools/make_icons.py` redraws the icons in `icons/`.

## Credits

**Crafted By Bash.**

The credit also appears in the extension itself: at the bottom right of the new tab page, at the foot of the Settings panel, and in the toolbar popup.

---

<p align="center"><sub>Speed Dial 1.0.0 &middot; Crafted By Bash</sub></p>
