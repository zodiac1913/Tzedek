# How Do I Fix This Excuse

## Purpose

This file is an audit of Tzedek's `Show me how to fix this` coverage for WCAG and accessibility findings.

The standard is stricter than the `More Info` audit:

- if a finding has a practical code, HTML, ARIA, CSS, or content fix that Tzedek can reasonably demonstrate, it should have a `Show me how to fix this` button
- if it does not have that button, there needs to be a specific explanation why
- if the issue is not meaningfully fixable through a code or markup example, the runtime should not pretend otherwise

## How The Runtime Works Now

The button only appears when `getComplianceFixContent(...)` returns real fix content.

That means the runtime is already designed around the right rule:

- fixable items should get a fix button
- non-fixable items should not get one
- special helper actions can still exist without pretending to be a fix recipe

## Audit Result

As of 2026-07-29, there is no active excuse list for the current WCAG and accessibility findings in the runtime.

The missing fix-button gaps that were easy and worth fixing have been fixed in code, including:

- document metadata issues such as missing or vague title, missing language declaration, and missing viewport metadata
- heading structure issues such as multiple level 1 headings, heading level skips, empty headings, and ARIA heading guidance
- image-meaning issues such as redundant alt text and presentation-role conflicts
- live-region issues such as invalid `aria-live` and missing `aria-atomic`
- validation-message issues such as missing error message elements
- interaction-context issues such as links opening in a new window without warning
- appearance and behavior issues such as low contrast, missing focus indicator, and reduced-motion support
- media-alternative issues such as missing transcript, captions, and descriptions
- list-structure issues such as empty lists and invalid direct list content

## Special Cases

`Multiple Level 1 Headings` still has an extra helper action to highlight the detected headings on the page.

That is not an excuse for missing fix guidance.

It now also has real `Show me how to fix this` content. The highlight action remains useful because the runtime still cannot decide for the author which heading should stay `h1` and which ones should become `h2` or lower.

## What Makes The Current Fix Guidance Better

The newer fix guidance tries to use the current page or current element context where practical.

Examples:

- current element text is reused in heading, link, button, contrast, and focus examples
- current media `src` values are reused in transcript, captions, and descriptions examples
- current image `src` and `alt` values are reused when suggesting better image markup
- current field IDs are reused when building label and error-message examples

That is the right direction because generic advice is less useful than a fix sketch that resembles the actual markup the user is looking at.

## Bottom Line

There are no currently known WCAG/accessibility findings in the runtime that still need a `How do I fix this` excuse.

If a future finding appears without fix guidance and it is clearly code/HTML/CSS/ARIA-fixable, that should be treated as a runtime gap and fixed in code, not defended in documentation.