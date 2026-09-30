# Speed Dial media pack

Editable SVG artwork and exported PNGs for the extension, Chrome Web Store, README, and GitHub social preview. The blue-to-purple palette and four-tile mark follow the extension's existing icon and UI. `preview/contact-sheet.png` gives a single-page overview.

The repository currently grants no open-source license; its README states that source rights are reserved. No license file is included in this pack.

## Use these files

| Placement | File | Size |
| --- | --- | --- |
| Chrome Web Store icon | `chrome-web-store/store-icon-128.png` | 128 × 128 PNG, with 16 px transparent padding |
| Small promo tile | `chrome-web-store/promo-small-440x280.png` | 440 × 280 PNG |
| Optional marquee | `chrome-web-store/promo-marquee-1400x560.png` | 1400 × 560 PNG |
| Store screenshot 1 | `chrome-web-store/screenshot-01-sections-light-1280x800.png` | 1280 × 800 PNG |
| Store screenshot 2 | `chrome-web-store/screenshot-02-tabs-dark-1280x800.png` | 1280 × 800 PNG |
| Store screenshot 3 | `chrome-web-store/screenshot-03-tile-editor-1280x800.png` | 1280 × 800 PNG |
| Store screenshot 4 | `chrome-web-store/screenshot-04-settings-1280x800.png` | 1280 × 800 PNG |
| Store screenshot 5 | `chrome-web-store/screenshot-05-tile-menu-1280x800.png` | 1280 × 800 PNG |
| README banner proposal | `repository/readme-banner-1280x480.png` | 1280 × 480 PNG |
| GitHub social preview | `repository/social-preview-1280x640.png` | 1280 × 640 PNG |
| Current manifest icon copies | `icons/extension-icon-{16,32,48,128}.png` | Existing extension sizes |

`source/` contains editable SVG artwork and copies of the original screenshots. The five store screenshots are clean 1280 × 800 exports of actual repository captures. The Sections view is cropped to the store aspect ratio while retaining the **New group** control.

## Submission checks

1. Confirm the screenshots show the version being submitted. They were made from the repository's saved captures, not from a newly run browser session.
2. Upload the store icon, small promo tile, and at least one screenshot. All five recommended screenshot slots are supplied in display order; the marquee is optional.
3. Review and publish a privacy policy and complete the store's data disclosures. Describe the optional Google favicon lookup, linked images, and default-engine search accurately.
4. Verify that the support, privacy, and homepage URLs are public before entering them in the listing. The public repository URL returned 404 without authentication on 2026-09-30.
5. Set `repository/social-preview-1280x640.png` in GitHub **Settings → Social preview**. Committing the file alone does not activate it.

## Screenshot captions

1. A light Sections layout with grouped tiles.
2. A dark new tab with site groups and quick search.
3. Edit a tile's address, group, image, and color.
4. Theme, layout, background, and backup settings.
5. Open a tile menu to edit, move, or delete a site.

## Design references

- [Chrome Web Store image guidance](https://developer.chrome.com/docs/webstore/best-listing)
- [Chrome Web Store image requirements](https://developer.chrome.com/docs/webstore/images)
- [GitHub social preview guidance](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/customizing-your-repositorys-social-media-preview)
