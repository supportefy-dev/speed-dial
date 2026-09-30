# Contributing

Thanks for helping improve Speed Dial.

## Before you start

- Search existing issues before opening a new one.
- Keep proposals focused on organizing tabs, reliability, accessibility, privacy, or maintainability.
- Do not introduce telemetry, remote code, or unnecessary permissions.
- This repository has no open-source license (see [Source rights](README.md#source-rights) in the README). Reporting a bug or suggesting a feature needs nothing from you but the report. A code contribution needs written agreement from Supportefy LLC, the copyright holder, before you put in the work, since there is no license that grants you the right to have it merged or reused. Open an issue first and say what you would like to change.

## Development

The extension uses plain ES modules with no runtime dependencies. Load the repository folder directly in Chrome or Edge using **Load unpacked**. Run `python tools/build.py` to produce the Chromium and Firefox packages in `dist/`, and test a change in both when it touches browser APIs.

Run the static checks before submitting a change:

```powershell
Get-ChildItem src\*.js | ForEach-Object { node --check $_.FullName }
Get-Content -Raw manifest.json | ConvertFrom-Json | Out-Null
```

For interface changes, manually verify:

1. Add, edit and delete a tile, including each image type (site icon, upload, link, letter).
2. Drag and drop for tiles, groups, bookmark-bar links and dropped image files.
3. Create, rename, recolor, reorder and delete a group in both the Tabs and Sections layouts.
4. Search, and `Enter` to fall through to the default search engine.
5. Export a backup, then restore it, then undo the restore.
6. Theme, layout, tile size and background changes in Settings.
7. If the change touches groups or licensing: the 3-group free limit, and activating and removing a Speed Dial Pro license key.

## Pull requests

- Use a short imperative title.
- Explain the problem and the chosen solution.
- List the checks and manual scenarios you ran.
- Include screenshots for visible interface changes.
- Keep unrelated refactors out of the same pull request.
