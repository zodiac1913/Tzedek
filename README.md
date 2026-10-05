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
- [Drag the bookmarklet from the installer](https://tzedek.dirtsailor.org/)

Unzip `Tzedek.zip`, then load that folder as an unpacked extension in Chrome or Edge. The Firefox package still needs Mozilla signing for a normal install.

Open the installer and drag the Tzedek Bookmarklet button to the bookmarks bar. GitHub's README cannot hold that `javascript:` link, so the drag target lives on [tzedek.dirtsailor.org](https://tzedek.dirtsailor.org/).

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

## Updating tzedek.dirtsailor.org

The Tzedek repository is the source of truth. `tzedek.dirtsailor.org` updates by requesting the latest published Tzedek GitHub release from its own server; Tzedek does not push runtime files directly to the live site. CATS copies of Tzedek files are legacy artifacts and are not part of this deployment flow.

The public server's code-server workspace serves files directly from `/config/workspace`. After publishing a **new Tzedek GitHub release** with `Tzedek.zip`, run this in that server's VS Code terminal:

```sh
TZEDEK_WEB_ROOT=/config/workspace bash /config/workspace/scripts/deploy-runtime-to-nginx.sh
```

The script installs the released runtime, `assets/`, and `compliance-bookmarklet.html`, and copies that installer to `index.html` as the homepage. Both pages are release-managed, replacing custom server copies, and their generated bookmarklet URL carries the release version. Back up any custom homepage before deploying. It preserves `vendor/`, homepage backups, and other local files. It can extract with Perl's `IO::Uncompress::Unzip` when other ZIP extractors are unavailable. The `.tzedek-release` stamp skips repeat deployments; set `TZEDEK_FORCE_DEPLOY=1` to reinstall the same release. No CATS files or credentials are needed.

**One-time upgrade:** the old server script skips the installer. Replace it before deploying:

```sh
curl -fL https://raw.githubusercontent.com/zodiac1913/Tzedek/main/scripts/deploy-runtime-to-nginx.sh -o /config/workspace/scripts/deploy-runtime-to-nginx.sh
TZEDEK_FORCE_DEPLOY=1 bash /config/workspace/scripts/deploy-runtime-to-nginx.sh
```

Then reload the homepage or `/tzedek/compliance-bookmarklet.html` without the browser cache. Both serve the same release-managed installer. When upgrading to homepage deployment, use the forced command above even if the current release is already recorded.

The deployed homepage includes `<base href="/tzedek/">`. The installer resolves its runtime and assets from that document base, so bookmarks made on the homepage use the server's CORS-enabled `/tzedek/` route, not the root route. Previously saved bookmarks that target `/smlCompliance.js` must be recreated from the updated installer.

If a separate `cms.gov` site is added later, document and validate its deployment flow independently rather than treating CATS as an intermediary.

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
