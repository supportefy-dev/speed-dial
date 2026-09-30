# Store submission sheet

Paste-ready answers for the Chrome Web Store and Microsoft Edge Add-ons dashboards, for Speed Dial 1.2.0. Every answer matches the current code; if the code changes, update this sheet in the same commit.

## Before you start

| Item | Where |
|---|---|
| Chrome Web Store developer account | https://chrome.google.com/webstore/devconsole (one-time $5 registration) |
| Edge Add-ons developer account | https://partner.microsoft.com/dashboard/microsoftedge (free) |
| Package | Run `python tools/build.py`, then upload `dist/speed-dial-1.2.0-chromium.zip` (manifest.json is at the zip root, as both stores require) |
| Reviewer license key | Issue one just before submitting (see "Notes for the reviewer") and paste it only into the dashboard, never into this repository |

## Store listing

**Name:** Speed Dial

**Summary** (132 characters max; this one is 106):

```
A customizable new tab: color-coded groups of sites, your own tile images, quick search and local backups.
```

**Description:** copy the "Detailed description" from [STORE-LISTING-COPY.md](STORE-LISTING-COPY.md), including the paragraph on Speed Dial Pro and the early-bird offer.

**Category:** Productivity > Workflow & Planning (Chrome). Productivity (Edge).

**Language:** English

**Graphics** (all in `assets/media-pack/chrome-web-store/`):

| Slot | File |
|---|---|
| Store icon 128x128 | `store-icon-128.png` |
| Screenshot 1 | `screenshot-01-sections-light-1280x800.png` |
| Screenshot 2 | `screenshot-02-tabs-dark-1280x800.png` |
| Screenshot 3 | `screenshot-03-tile-editor-1280x800.png` |
| Screenshot 4 | `screenshot-04-settings-1280x800.png` |
| Screenshot 5 | `screenshot-05-tile-menu-1280x800.png` |
| Screenshot 6 (Edge accepts up to 10; Chrome up to 5, so drop screenshot 4 there) | `screenshot-06-pro-1280x800.png` |
| Small promo tile 440x280 | `promo-small-440x280.png` |
| Marquee 1400x560 (optional) | `promo-marquee-1400x560.png` |

**Homepage URL:** https://github.com/supportefy-dev/speed-dial

**Support URL:** https://github.com/supportefy-dev/speed-dial/issues

**Privacy policy URL:** https://github.com/supportefy-dev/speed-dial/blob/main/PRIVACY.md

## Privacy practices (Chrome) / Properties (Edge)

**Single purpose:**

```
Speed Dial replaces the new tab page with the user's own dial of website shortcuts, organized into color-coded groups, with tools to add, edit, search and back up those shortcuts.
```

**Permission justifications:**

| Permission | Justification to paste |
|---|---|
| `storage` | Saves the user's groups, tiles and settings locally in the browser. |
| `unlimitedStorage` | Tiles can use images the user uploads, and the new tab can use an uploaded background image; these can exceed the default local storage quota. |
| `favicon` | Shows each saved site's icon from the browser's own favicon cache, without any network request. |
| `topSites` | Lets the user import their most visited sites as tiles. It is read only when the user clicks "Import most visited sites". |
| `search` | The search box on the new tab sends the user's query to their default search engine. |
| `contextMenus` | Adds "Add this page to Speed Dial" and "Add link to Speed Dial" to the right-click menu. |
| `activeTab` | When the user clicks the toolbar button, reads the current tab's address and title to prefill the tile they are adding. |

**Host permissions:** none.

**Remote code:** No, I am not using remote code. All JavaScript is included in the package; nothing is loaded or evaluated from the network.

**Data usage** (what the extension collects or transmits):

- Tick **Web history**. When a saved tile uses "Site icon", Chrome has no icon cached for it, and the user has left "Fetch missing site icons" on, the site's origin (for example `https://example.com`) is sent to Google's favicon service to get the icon. The user can turn this off in Settings. Nothing else about browsing is transmitted: most visited sites and tile addresses stay in the browser.
- Do **not** tick the other categories. The Pro license key contains the buyer's email address, but it is stored locally and checked offline; the extension never transmits it. Purchases happen on PayPal's website.

**Certifications** (tick all three):

- I do not sell or transfer user data to third parties, outside of the approved use cases.
- I do not use or transfer user data for purposes unrelated to my item's single purpose.
- I do not use or transfer user data to determine creditworthiness or for lending purposes.

## Distribution and pricing

- **Visibility:** Public
- **Regions:** All regions
- **Pricing:** Free. Declare that the item contains **in-app purchases**: Speed Dial Pro is an optional one-time purchase ($3.99; $2.99 launch price until 31 October 2026) paid through PayPal outside the store. The free version keeps every feature with up to 3 groups.

## Notes for the reviewer

Paste this into "Notes for certification" (Edge) or the review notes (Chrome), after issuing a reviewer key with the owner's license issuing tool (kept outside this repository) for product `speed-dial-pro` and email `reviewer@supportefy.com`.

```
Speed Dial replaces the new tab page. Everything works without an account.

Speed Dial Pro (optional, one-time purchase through PayPal) only removes the 3-group limit.
To test it: open a new tab, create a 4th group with the "+" next to the group tabs.
The Pro screen opens. Paste this reviewer license key under "Already have a license key?"
and click Activate:

<paste the BASH1- reviewer key here>

The key is verified offline with an embedded public key (ECDSA P-256); no network call is made.
The "Fetch missing site icons" setting (on by default, can be turned off in Settings) requests
missing site icons from Google's favicon service, sending only the site's origin.
```

## After approval

- Add the store link to the README install section and to `manifest.json`'s `homepage_url` if you want it on the extension's details page.
- Keep this sheet, [STORE-LISTING-COPY.md](STORE-LISTING-COPY.md) and [PRIVACY.md](../../PRIVACY.md) in step with every release that changes permissions or data handling.
