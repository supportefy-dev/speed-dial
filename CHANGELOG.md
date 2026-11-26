# Changelog

All notable changes to Speed Dial are documented in this file.

## 1.3.0 - 2026-11-26

### Added

- **Show bookmarks bar** (Settings > Behavior, off by default): shows your browser's bookmarks bar at the top of Speed Dial, with folders and subfolders opening as menus. Turn off the browser's own bookmarks bar to see your bookmarks only on Speed Dial. The bar follows bookmark changes as they happen.
- The `bookmarks` permission is optional: it is requested only when you turn the setting on and given back when you turn it off, so existing users see no new permission prompt on update.

### Changed

- A new tab no longer shows a half-drawn page: tiles, groups and your background image appear together on the first paint.
- **Fetch missing site icons** is now off by default for new installs, so no site address is sent to Google's favicon service unless you turn it on. Existing settings are kept.
- The privacy policy and the setting's hint now say that Firefox, which has no icon cache Speed Dial can read, looks up every site icon while the setting is on.
- The README links to the Chrome Web Store listing.

## 1.2.1 - 2026-09-30

### Changed

- The extension's full name is now **Speed Dial: Groups & Tiles**, the name used in the Chrome Web Store and Edge Add-ons. The short name shown in tight spaces stays "Speed Dial".
- The Chrome Web Store screenshots were retaken from the current build, a sixth showing Speed Dial Pro was added, and a paste-ready store submission sheet was added (`assets/media-pack/STORE-SUBMISSION.md`).

## 1.2.0 - 2026-09-30

### Added

- Firefox support (preview): a separate Firefox package built by `tools/build.py`, with a Firefox manifest, the background code run as a module script, and site icons from the online lookup because Firefox has no extension icon cache.
- Tiles can point at internal pages of Edge, Brave, Opera and Vivaldi (`edge://`, `brave://`, `opera://`, `vivaldi://`).
- A browser support table and per-browser install steps in the README.
- A LICENSE file: Copyright (c) 2026 Supportefy LLC. All rights reserved.

### Changed

- The popup's **Open Speed Dial** button opens Speed Dial itself, so it also works in browsers that do not let extensions replace the new tab (Opera, Arc).
- Web search uses whichever search API the browser provides.

## 1.1.0 - 2026-09-30

### Added

- Speed Dial Pro: a one-time purchase ($3.99 USD, $2.99 until 2026-10-31) that unlocks unlimited groups. Buy through **Settings > Speed Dial Pro**, then paste the emailed license key; the key is verified on-device with a digital signature.
- A 3-group limit on the free tier. Existing groups are never removed; only creating a 4th group asks for Pro.
- Early-bird offer: Pro free forever for the first 100 users, claimed by email to bash@supportefy.com.
- Removing a license from the browser can be undone.

## 1.0.0 - 2026-09-30

### Added

- Groups shown as tabs or as collapsible sections.
- Custom tiles: title, address, color and image (site icon, upload, link or letter).
- Drag and drop for tiles, groups, bookmarks-bar links and dropped image files.
- Search across saved sites, falling through to the default search engine.
- Light, dark and automatic themes, plus an optional background image.
- Local backup export and restore, with undo.
- A toolbar popup and a right-click context menu for adding the current page.
- Credits and a support link.
