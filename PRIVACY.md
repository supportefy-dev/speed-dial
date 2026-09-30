# Speed Dial privacy policy

Effective 2026-09-30. Applies to the Speed Dial Chrome extension, version 1.0.0 and later (Pro licensing from 1.1.0).

Speed Dial is a new tab page for your own list of sites. It has no account, no analytics, no advertising and no server run by its developer. The extension never sends your data to the developer, and the developer does not sell or share your data.

The one exception is Speed Dial Pro: if you buy a license or claim an early-bird key, the developer receives your email address (from PayPal's payment notice, or from the email you send) and uses it only to send you your license key.

## What is stored, and where

Everything Speed Dial keeps is saved in your browser with `chrome.storage.local`:

- your groups (names and colors) and tiles (addresses, titles, colors and image choices)
- images you upload for tiles or the background, resized and stored as image data
- your settings (theme, layout, tile size, and similar options)

This data stays on your computer. It is not synced through your Google account.

## When information leaves the browser

Speed Dial only contacts other services in these cases:

| When | What is sent | To whom |
|---|---|---|
| A tile uses **Site icon**, Chrome has no icon cached for that site, and **Settings > Fetch missing site icons** is on (the default) | The site's origin, for example `https://example.com` | Google's favicon service |
| A tile uses **Link** as its image | A normal image request for that link | The server hosting the image |
| You press `Enter` in the search box | Your search text | Your browser's default search engine, through Chrome |
| You open a tile | A normal visit to that site | That site |

Turning off **Fetch missing site icons** stops the favicon requests; those tiles then show a letter.

## Browsing data Speed Dial reads

- **Most visited sites** (`topSites`) are read only when you choose **Import most visited sites**, and only to create tiles you can edit or delete.
- **The current tab's address and title** (`activeTab`) are read only when you click the toolbar button, to prefill the tile you are adding.
- **Site icons** are read from Chrome's own favicon cache.

Speed Dial has no host permissions and never reads the content of the pages you visit.

## Speed Dial Pro license

- Buying Pro happens on PayPal's own website, under PayPal's privacy terms. Speed Dial only opens the payment page; it never sees your payment details.
- Early-bird keys are requested by an email you send from your own email app.
- Your license key contains the email address it was issued to, the issue date and the product name. It is stored in `chrome.storage.local`, verified on your device with a digital signature, and never sent anywhere. It is not included in exported backups.
- Removing the license in **Settings > Speed Dial Pro** deletes it from the browser.

## Backups

**Export backup** saves a JSON file to the location you choose. It contains your groups, tiles, uploaded images and background image. Keep it private if your tiles are. **Restore from backup** reads a file you pick and replaces your current Speed Dial straight away; an **Undo** notice lets you reverse it.

## Deleting your data

- Delete individual tiles or groups from the page.
- Removing the extension from `chrome://extensions` deletes everything it stored.
- Exported backup files are ordinary files on your computer; delete them like any other file.

## Changes

If Speed Dial's data handling changes, this policy will be updated in the same release, with a new effective date.

## Contact

Speed Dial is Crafted By Bash. Questions about this policy can be raised through the project's repository: https://github.com/supportefy-dev/speed-dial
