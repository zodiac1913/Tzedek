# Tzedek Guidance

## Purpose

Tzedek is a standalone accessibility checker focused on finding WCAG and Section 508 issues quickly, locating the affected element, linking to the relevant guidance, and giving practical fix direction.

It is designed to help people review real pages quickly: identify issues, jump to the affected element, understand why the issue matters, and get practical fix guidance.

Tagline:

> A product of the Small-Mighty-Light framework.

## Delivery Model

Tzedek must support two delivery paths built from one shared runtime:

- Chromium extension for Edge and Chrome
- bookmarklet for ANDI-style usage

The extension and bookmarklet should behave as similarly as possible.

Do not create a richer product in the extension and a weaker one in the bookmarklet unless the user explicitly asks for that tradeoff.

## Current Project State

Tzedek currently uses one shared browser runtime with thin delivery-specific packaging around it.

Current shared runtime files:

- `src/runtime/smlCompliance.js`
- `src/runtime/smlComplianceRunner.js`

The extension build copies live under:

- `extension/page/smlCompliance.js`
- `extension/page/smlComplianceRunner.js`

Use these helper scripts:

- `npm run import:cats`
- `npm run extension:sync`

Legacy names such as `smlCompliance` still exist in code and filenames while the standalone runtime is being stabilized. Treat those as transitional implementation details, not product naming.

## Architecture Intent

Prefer a shared runtime with thin launchers.

Target split:

1. `core`
   DOM scanning, rule evaluation, issue modeling, selector building, fix guidance, literature mapping.

2. `ui`
   Floating panel, highlighting, issue navigation, copy/fix helpers.

3. `runner`
   Shared startup and orchestration.

4. `launchers`
   Extension and bookmarklet bootstrapping only.

## Key Constraints

1. Keep MIT licensing and open-source distribution in mind.
2. Favor public-web portability over legacy site-specific assumptions.
3. Remove hard-coded site-local paths such as `/js/global/sml/Docs/...` and `/lib/...` as the runtime is refactored.
4. Keep the shared audit behavior aligned across extension and bookmarklet.
5. Prefer minimal, practical architecture over framework-heavy rewrites.

## Asset And Dependency Notes

Do not assume one legacy stylesheet or helper file explains the full dependency surface.

Current observations from the runtime and parity fixtures:

1. `catsStrap.css`
   Not a direct standalone runtime import right now, but it still influences some color-replacement guidance and parity behavior.

2. `sml.js`
   Potentially important for Small-Mighty-Light custom elements and parity fixtures such as `sml-page`, `cc-container`, and `sml-auto-complete`. Even if Tzedek should run on arbitrary pages without it, keep it in mind for fixture parity and framework page support.

3. `sml.css`
   Not currently imported by the standalone runtime, but it is referenced in some suggestion text and may matter for realistic style guidance or parity demos.

4. `site.css`
   No current direct runtime dependency has been confirmed, but do not assume it is irrelevant until visual or fixture parity has been checked.

5. Bootstrap-like classes
   The imported runtime uses many Bootstrap-style class names such as `btn`, `alert`, and `modal`. Long term, Tzedek should either carry the minimal styling it needs or stop relying on ambient site CSS.

## SML Retention Policy

Keep the SML pieces that Tzedek actually uses.

Prune unused SML functions, methods, and helpers only when one of these is true:

1. the code is clearly unrelated to Tzedek's accessibility-checker purpose
2. the code adds meaningful runtime or package weight
3. the code is not likely to be needed for Tzedek's foreseeable purview

Do not remove SML support just because it is legacy. If a feature helps Tzedek operate on Small-Mighty-Light pages, custom elements, or parity fixtures, bias toward keeping it until proven unnecessary.

If there is doubt, prefer keeping the code for now. Earlier runtime history can still be used as a reference if a later targeted extraction is needed.

## CSS Consolidation Policy

Once Tzedek's real CSS dependencies are confirmed, consolidate them into one standalone stylesheet named `Tzedek.css`.

Preferred approach:

1. start from the current `catsStrap.css` base because it already carries Bootstrap-derived styling and existing color class behavior
2. preserve the color classes and theme pieces that Tzedek uses for contrast suggestions and class-based replacement guidance
3. merge in any actually-required rules from `sml.css` or other supporting CSS files
4. remove classes and rules that Tzedek does not use only after dependency confidence is high

Do not aggressively strip legacy styling too early. Tzedek's contrast and remediation guidance currently benefits from class-based alternatives that come from that theme layer.

## Public Distribution Direction

The intended public path is:

1. a public GitHub repository for Tzedek
2. GitHub Pages hosting for bookmarklet loader and runtime assets
3. unpacked and packaged Chromium extension artifacts for Edge and Chrome

## Naming Guidance

Use `Tzedek` as the product name in user-facing docs and future UI text.

It is acceptable for transitional internal filenames and symbols to still reference `smlCompliance` or `SMLC` while the standalone repo is being stabilized. Rename carefully and incrementally rather than with broad churn.

## What To Do Next

Preferred order of work:

1. remove remaining legacy asset and path assumptions
2. stabilize the extension launcher around the shared runtime
3. add bookmarklet loader artifacts that can point to GitHub Pages
4. gradually rename internal symbols from SMLC toward Tzedek where useful
