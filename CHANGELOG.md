# Changelog

All notable changes to Speed Dial are documented in this file.

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
