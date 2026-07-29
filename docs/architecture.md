# Tzedek Architecture

## Goal

Keep one shared audit experience and expose it through two delivery paths:

- extension
- bookmarklet

The delivery method changes. The audit engine, panel behavior, highlighting, issue navigation, guidance links, and fix suggestions stay aligned.

## Near-Term Structure

- `src/runtime/`: shared runtime source
- `extension/page/`: copied runtime files used by the browser extension
- `bookmarklet/`: public-loader and distribution notes

## Runtime Trimming Strategy

The current runtime should be reduced carefully, not by blanket rewrite.

Rules:

1. retain SML code that Tzedek actually uses or may reasonably need for Small-Mighty-Light page support
2. remove imported functions or methods only when they are outside Tzedek's scope or materially hurt runtime/package size
3. use earlier runtime behavior as reference material when reintroducing or comparing trimmed behavior

## CSS Strategy

Tzedek should converge on a single standalone stylesheet, tentatively `Tzedek.css`.

That stylesheet should be assembled from:

1. the required subset of `catsStrap.css`
2. any truly required rules from `sml.css`
3. any additional local runtime styles that Tzedek needs

Important constraint:

Do not remove all legacy theme-derived styling. Tzedek's contrast guidance uses class-based alternatives, so the palette and relevant class surface should remain available unless there is a better replacement model.

## Target Runtime Split

1. `core`
   DOM scanning, rule evaluation, issue modeling, selector building, fix guidance, literature mapping.

2. `ui`
   Floating panel, element highlighting, issue navigation, copy/fix helpers.

3. `runner`
   Shared startup and orchestration entrypoint.

4. `launchers`
   Extension launcher and bookmarklet loader only.

## Assumptions To Remove

- fallback paths rooted under `/js/global/sml/Docs/`
- site-local asset paths such as `/lib/...`
- assumptions about one host application's landmarks or wrappers

## Public Distribution Direction

Tzedek should be able to publish bookmarklet assets from a public GitHub repository, ideally through GitHub Pages, while packaging the same runtime into a Chromium extension for Edge and Chrome.

## Issue Guide Direction

Long-form finding help should live on a real page, not in another popup layered on top of the audited page.

Current implementation direction:

1. keep the inline finding pane short and issue-list driven
2. use `More Info` for canonical external references when a strong source exists
3. use `Tzedek Guide` for Tzedek-authored explanation, review checklist, and fix-oriented context on a dedicated page
4. reuse runtime logic where possible instead of duplicating finding summaries and fix guidance in separate assets

Current content coverage is strongest in these guide categories:

- document structure and core page basics
- common link and navigation findings
- forms and validation findings
- table findings

Next working direction:

1. expand `src/runtime/assets/tzedekIssueGuideData.js` by category rather than one-off titles
2. prioritize custom controls and ARIA semantics next, because that cluster has many user-visible findings and benefits from plain-language explanation
3. after that, cover media and embedded content, then any remaining structure or interaction edge cases

Working rule:

- do not reopen the WCAG checklist unless a new detector or capability is being added
- treat remaining work here as guide-content and explanation-quality expansion, not unfinished core checker implementation
