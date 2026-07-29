# Tzedek Extension

Load this folder as an unpacked extension in Edge, Chrome, or Firefox.

If you do not want to clone the repo, use the release assets from GitHub instead:

1. Download the latest stable extension zip from `https://github.com/zodiac1913/Tzedek/releases/latest/download/Tzedek.zip`.
2. Download the latest Firefox package from `https://github.com/zodiac1913/Tzedek/releases/latest/download/Tzedek-Firefox.xpi`.
3. Or open the Releases page if you specifically want older versioned assets such as `tzedek-extension-YYYY.MM.DD.xx.zip` or `tzedek-firefox-YYYY.MM.DD.xx.xpi`.
4. Unzip the Chromium package on your machine if you want to load it unpacked in Chrome or Edge.
5. In Chrome or Edge, open the browser extensions page, enable developer mode, and load the unzipped folder as an unpacked extension.
6. In Firefox, open `about:debugging#/runtime/this-firefox` and load `manifest.json` as a temporary add-on, or use the `.xpi` as the package you submit for Mozilla signing.

For maintainers, publish a new version from GitHub Actions with the `Release Extension Zip` workflow and a release version in `YYYY.MM.DD.xx` format such as `2026.07.29.01`.

Note: Chromium requires numeric manifest versions without leading zeroes. The workflow keeps your exact `YYYY.MM.DD.xx` string as the release name and `version_name`, and writes a normalized manifest `version` such as `2026.7.29.1` inside the packaged extension.

The shared manifest declares both `background.service_worker` and `background.scripts` so current Chromium browsers use the service worker and Firefox 121+ uses the background script fallback from the same package.

The Firefox `.xpi` artifact is an unsigned package produced for Firefox packaging workflows. Persistent Firefox installation outside temporary developer loading still requires Mozilla signing.

## Refresh Runtime Files

Run:

```bash
npm run extension:sync
```

## Load Unpacked

1. Open the browser extensions page.
2. Enable developer mode.
3. Choose "Load unpacked".
4. Select the `extension/` folder.
5. Click the Tzedek toolbar button on any page.

## Load In Firefox

1. Open `about:debugging#/runtime/this-firefox`.
2. Choose "Load Temporary Add-on".
3. Select `extension/manifest.json` from this repo.
4. Click the Tzedek toolbar button on any page.
