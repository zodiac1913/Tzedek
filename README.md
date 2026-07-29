# Tzedek

Tzedek is a standalone accessibility checker focused on finding WCAG and Section 508 issues quickly, locating the affected element, linking to the relevant guidance, and giving practical fix direction.

It is built to help reviewers inspect real pages fast: identify issues, jump to the affected element, understand why the issue matters, and get practical fix guidance.

Tzedek is intended to ship through two delivery paths built from the same shared runtime:

- browser extension for Edge and Chrome
- bookmarklet for ANDI-style use

Tagline:

> A product of the Small-Mighty-Light framework.

## Layout

- `src/`: shared runtime source
- `extension/`: browser extension launcher and packaged page runtime
- `bookmarklet/`: bookmarklet distribution notes and future loader artifacts
- `demo/`: standalone static page for validating the shared runtime in isolation
- `scripts/`: import and release helper scripts
- `docs/`: architecture and distribution planning

## How It Runs

Tzedek is meant to run in the browser against the page you are reviewing.

There are two planned usage modes:

1. Extension: click the Tzedek browser extension on the current page.
2. Bookmarklet: click a saved bookmark that loads the shared runtime into the current page.

## Standalone Demo

Run `npm run demo:sync` to copy the shared runtime and assets into `demo/page/`.

Then serve the repo with any static web server and open `demo/index.html`. Example:

```sh
python3 -m http.server 4183
```

Open `http://localhost:4183/demo/` to exercise Tzedek against the intentionally imperfect demo page.

The demo is a development surface. It exists to validate the shared runtime and UI outside the extension flow.

## Extension Packaging

Run `npm run extension:sync` to copy the shared runtime into `extension/page/` and generate square extension icons in `extension/icons/` from `src/runtime/assets/Righteousness.png`.

The extension manifest is wired to those generated square icons so the browser toolbar and extension management surfaces do not rely on the original 26x18 source asset directly.

Once loaded into Chrome or Edge, Tzedek runs from the browser extension UI on the current page.

For user distribution, publish a versioned extension zip from the `Release Extension Zip` GitHub Actions workflow using your `YYYY.MM.DD.xx` format, for example `2026.07.29.01`. Users can then download `tzedek-extension-YYYY.MM.DD.xx.zip` from the GitHub Releases page, unzip it locally, and load the extracted folder as an unpacked extension.

Chromium requires numeric manifest versions without leading zeroes. The release workflow keeps your exact `YYYY.MM.DD.xx` string as the GitHub release name and the extension `version_name`, and writes a normalized manifest `version` such as `2026.7.29.1` into the packaged extension.

To test the unpacked extension manually:

1. Open `chrome://extensions` or `edge://extensions`.
2. Enable Developer mode.
3. Choose Load unpacked.
4. Select the `extension/` folder from this repo.
