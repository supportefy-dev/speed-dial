![Speed Dial: your sites, organized your way](assets/media-pack/repository/readme-banner-1280x480.png)

# Speed Dial

A customizable Chrome new tab for your favorite sites. Organize links into color-coded groups, choose your own tile images, and move your setup with a local backup file.

**Start here:** [Install](#install) · [Preview](#preview) · [Your data](#privacy-and-permissions)

> Requires Chrome 116 or newer. Speed Dial currently installs through Chrome's **Load unpacked** flow.

## Install

1. Download or clone this repository.
   ```bash
   git clone https://github.com/supportefy-dev/speed-dial.git
   ```
2. Open `chrome://extensions` and switch on **Developer mode** (top right).
3. Click **Load unpacked** and select the folder that contains `manifest.json`.
4. Open a new tab. When Chrome asks whether to keep the changed new tab page, choose **Keep it**.

To update, pull the latest changes and press the reload icon on the Speed Dial card in `chrome://extensions`.

## What you can do

- **Organize sites.** Color-coded groups shown as tabs or as stacked, collapsible sections. Drag to reorder tiles and groups, or drop a tile on another group.
- **Personalize tiles.** Set each tile's title, address, color and image: the site's icon, an uploaded picture, an image link, or a letter.
- **Add sites quickly.** The **+** tile, the toolbar button, the right-click menu, dragging links from the bookmarks bar, or importing your most visited sites.
- **Keep your setup.** Everything is saved in the browser. Export a backup file and restore it on another computer; deletes, moves and restores can be undone.

## Preview

| Tabs, dark theme | Sections, light theme |
|---|---|
| ![Tabs layout in the dark theme](docs/screenshots/tabs-dark.png) | ![Sections layout in the light theme](docs/screenshots/sections-light.png) |

<details>
<summary>More screenshots: tile editor, tile menu, settings, narrow window</summary>

| Tile editor | Tile menu |
|---|---|
| ![Tile editor](docs/screenshots/tile-editor.png) | ![Tile menu](docs/screenshots/tile-menu.png) |

| Settings | Narrow window |
|---|---|
| ![Settings panel](docs/screenshots/settings.png) | ![Narrow window](docs/screenshots/narrow.png) |

</details>

## How to use it

| To | Do this |
|---|---|
| Add a site | Click the dashed **+** tile, use the toolbar button, right-click a page or link, or drag a link onto the grid |
| Edit a site | Hover it and click **...**, right-click it, or focus it and press `F2` |
| Change a tile's picture | Edit the site and pick **Site icon**, **Upload**, **Link** or **Letter**, or drop an image file onto the tile |
| Reorder sites | Drag them, or press `Alt + Left/Right` on the focused tile |
| Move a site to another group | Drag it onto the group's tab (hover to open the group and drop it in place), or use **Move to** in its menu |
| Create a group | The **+** after the group tabs, or **New group** at the bottom of the Sections layout |
| Rename or recolor a group | Double-click its tab, or right-click and choose **Edit group** |
| Reorder groups | Drag the group tabs, or drag the section headers in the Sections layout |
| Search | Typing filters your saved sites across all groups; `Enter` searches the web with your default search engine |
| Change layout, theme, sizes, background | Open **Settings** (top right) |
| Undo | Click **Undo** on the notice at the bottom of the page |

> Chrome does not let extensions read the shortcuts on Google's own new tab page. Use **Settings > Import most visited sites**, or click the toolbar button on each site you want to keep.

## Privacy and permissions

Speed Dial has no account, no analytics and no server of its own. Your groups, tiles, uploaded images, background and settings are saved in the browser (`chrome.storage.local`). A few actions do reach other services:

- **Missing site icons.** When Chrome has no icon cached for a site and **Settings > Fetch missing site icons** is on, the site's origin (for example `https://example.com`) is sent to Google's favicon service. Turn it off and those tiles show a letter.
- **Image links.** A tile that uses an image link loads that image from its host.
- **Search.** Pressing `Enter` in the search box sends the text to your default search engine.
- **Backups.** Exported backup files are saved where you choose; they contain your tiles, uploaded images and background.

The full policy is in [PRIVACY.md](PRIVACY.md).

| Permission | Why it is needed |
|---|---|
| `storage`, `unlimitedStorage` | Save your groups, tiles, uploaded images and background |
| `favicon` | Read site icons from Chrome's local cache |
| `topSites` | Import your most visited sites, only when you ask |
| `search` | Send the search box to your default search engine |
| `contextMenus` | The **Add to Speed Dial** right-click entries |
| `activeTab` | Read the current page's address and title when you click the toolbar button |

Speed Dial requests no host permissions and never reads the content of the pages you visit.

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

## Development

- Plain ES modules with no build step and no runtime dependencies. Edit a file, then reload the extension in `chrome://extensions`.
- Strings live in `_locales/en/messages.json`. To translate, add `_locales/<language>/messages.json` with the same keys.
- Sizes, colors, timings and limits live in `src/config.js`; visual tokens live at the top of `src/newtab.css`.
- `python tools/make_icons.py` redraws the icons in `icons/` (needs Pillow).
- Store and README artwork, with editable SVG sources and listing copy, is in [`assets/media-pack/`](assets/media-pack/README.md).

<details>
<summary>Project structure</summary>

```
manifest.json            Extension manifest (MV3)
_locales/en/             Every user-facing string
icons/                   Toolbar and store icons
assets/media-pack/       Store, README and social artwork plus sources
docs/screenshots/        Images used in this README
tools/make_icons.py      Regenerates icons/
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
  credits.js             Credit, version and support links
  popup.html/.js/.css    Toolbar popup for adding the current page
  background.js          Service worker: right-click menu entries and first-run setup
  config.js              Every tunable value in one place
```

</details>

## Source rights

This repository does not currently grant an open-source license. All rights are reserved. The installation steps above are for using the current extension; reusing, modifying for redistribution, or commercializing the source requires the project owner's permission. Licensing terms may change later.

## Credits

**Crafted By Bash.** The credit also appears in the extension: on the new tab page, in the Settings panel and in the toolbar popup.

## Support development

Speed Dial is free to use. If it helps you, you can [make a one-time donation on PayPal](https://paypal.me/BashOM). Donations are optional and do not unlock features.

---

<p align="center"><sub>Speed Dial 1.0.0 &middot; Crafted By Bash</sub></p>
