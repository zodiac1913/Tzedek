# Tzedek

Tzedek is a standalone accessibility checker focused on finding WCAG and Section 508 issues quickly, locating the affected element, linking to the relevant guidance, and giving practical fix direction.

It is built to help reviewers inspect real pages fast: identify issues, jump to the affected element, understand why the issue matters, and get practical fix guidance.

Tzedek is intended to ship through two delivery paths built from the same shared runtime:

- browser extension for Edge and Chrome
- bookmarklet for ANDI-style use

Tagline:

> A product of the Small-Mighty-Light framework.

## Install

- [Download the Chrome and Edge extension](https://github.com/zodiac1913/Tzedek/releases/latest/download/Tzedek.zip)
- [Download the Firefox package](https://github.com/zodiac1913/Tzedek/releases/latest/download/Tzedek-Firefox.xpi)
- [Drag the bookmarklet from the installer](https://zodiac1913.github.io/Tzedek/demo/page/compliance-bookmarklet.html)

Unzip `Tzedek.zip`, then load that folder as an unpacked extension in Chrome or Edge. The Firefox package still needs Mozilla signing for a normal install.

Open the installer and drag the Tzedek Bookmarklet button to the bookmarks bar. GitHub's README cannot hold that `javascript:` link, so the drag target lives on the hosted installer page.

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

## Updating the public Tzedek server

The public code-server workspace serves files directly from `/config/workspace`; it is separate from the CATS intranet. After publishing a **new Tzedek GitHub release** with `Tzedek.zip`, run this in the public server's VS Code terminal:

```sh
TZEDEK_WEB_ROOT=/config/workspace bash /config/workspace/scripts/deploy-runtime-to-nginx.sh
```

The script pulls the latest Tzedek release into that workspace, updating only `smlCompliance.js`, `smlComplianceRunner.js`, and `assets/`. It can extract with Perl's `IO::Uncompress::Unzip` when `unzip`, Python, and `bsdtar` are unavailable. The explicit `TZEDEK_WEB_ROOT` also works with the older script already on the server once this updated script is copied there. It leaves the site's `index.html`, installer, `vendor/`, and other local files alone. It records the deployed release in `.tzedek-release` and skips repeat runs. The latest release does not contain local, unreleased changes; publish a new release first. No CATS files or credentials are needed on the public server.

## Extension Packaging

Run `npm run extension:sync` to copy the shared runtime into `extension/page/` and generate square extension icons in `extension/icons/` from `src/runtime/assets/Righteousness.png`.

The extension manifest is wired to those generated square icons so the browser toolbar and extension management surfaces do not rely on the original 26x18 source asset directly.

Once loaded into Chrome, Edge, or Firefox, Tzedek runs from the browser extension UI on the current page.

For user distribution, publish a versioned extension package from the `Release Extension Zip` GitHub Actions workflow using your `YYYY.MM.DD.xx` format, for example `2026.07.29.01`. The workflow now publishes both `tzedek-extension-YYYY.MM.DD.xx.zip` for Chromium-style unpacked loading and `tzedek-firefox-YYYY.MM.DD.xx.xpi` for Firefox packaging/signing workflows.

Chromium requires numeric manifest versions without leading zeroes. The release workflow keeps your exact `YYYY.MM.DD.xx` string as the GitHub release name and the extension `version_name`, and writes a normalized manifest `version` such as `2026.7.29.1` into the packaged extension.

The Firefox `.xpi` artifact is structurally the same extension package with a Firefox-oriented filename. For normal Firefox distribution outside temporary loading, the package still needs Mozilla signing.

The manifest is set up for current Chromium and Firefox MV3 behavior by declaring both a background service worker and a background script fallback. Firefox also includes a `gecko` extension ID and requires Firefox 121 or newer for this shared manifest shape.

To test the unpacked extension manually:

1. In Chrome or Edge, open `chrome://extensions` or `edge://extensions`.
2. Enable Developer mode.
3. Choose Load unpacked.
4. Select the `extension/` folder from this repo.
5. In Firefox, open `about:debugging#/runtime/this-firefox`.
6. Choose Load Temporary Add-on.
7. Select `/extension/manifest.json` from this repo.
