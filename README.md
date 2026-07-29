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
python3 -m http.server 4173
```

Open `http://localhost:4173/demo/` to exercise Tzedek against the intentionally imperfect demo page.

The demo is a development surface. It exists to validate the shared runtime and UI outside the extension flow.

## Extension Packaging

Run `npm run extension:sync` to copy the shared runtime into `extension/page/` and generate square extension icons in `extension/icons/` from `src/runtime/assets/Righteousness.png`.

The extension manifest is wired to those generated square icons so the browser toolbar and extension management surfaces do not rely on the original 26x18 source asset directly.

Once loaded into Chrome or Edge, Tzedek runs from the browser extension UI on the current page.

To test the unpacked extension manually:

1. Open `chrome://extensions` or `edge://extensions`.
2. Enable Developer mode.
3. Choose Load unpacked.
4. Select the `extension/` folder from this repo.
