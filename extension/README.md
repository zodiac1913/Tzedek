# Tzedek Extension

Load this folder as an unpacked Chromium extension in Edge or Chrome.

If you do not want to clone the repo, use the release zip from GitHub instead:

1. Download the latest stable extension zip from `https://github.com/zodiac1913/Tzedek/releases/latest/download/Tzedek.zip`.
2. Or open the Releases page if you specifically want an older versioned asset such as `tzedek-extension-YYYY.MM.DD.xx.zip`.
3. Unzip it on your machine.
4. Open the browser extensions page.
5. Enable developer mode.
6. Load the unzipped extension folder as an unpacked extension.

For maintainers, publish a new version from GitHub Actions with the `Release Extension Zip` workflow and a release version in `YYYY.MM.DD.xx` format such as `2026.07.29.01`.

Note: Chromium requires numeric manifest versions without leading zeroes. The workflow keeps your exact `YYYY.MM.DD.xx` string as the release name and `version_name`, and writes a normalized manifest `version` such as `2026.7.29.1` inside the packaged extension.

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
