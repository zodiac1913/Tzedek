# WCAG 508 Compliance Checklist

Date: 2026-07-29
Scope: `src/runtime/smlCompliance.js`, `src/runtime/smlComplianceRunner.js`, `demo/`, `bookmarklet/`, and any synced runtime consumers that ship Tzedek behavior
Purpose: Keep one working checklist of accessibility items that are completed, actively being refined, or still need to be added. Move items between sections as work lands.
Primary tracker: This file is the single source of truth for Tzedek accessibility status, including WCAG, Section 508, and relevant ANDI-style parity work.

Status: Feature-complete for the currently tracked WCAG/508 checks and adopted ANDI-style parity items. No open implementation items remain in this checklist as of 2026-07-29.

## Completed

### Page and document structure

- Page title presence
- Vague page title detection
- Language declaration presence
- Redundant language declaration detection
- Viewport meta presence
- Main landmark presence
- Navigation landmark presence
- Custom landmark-like container review for likely navigation and main content
- Missing heading detection
- Missing H1 detection
- Multiple H1 detection
- Heading level skip detection
- Empty heading detection
- ARIA heading role review

### Labels, names, and ARIA references

- Duplicate `id` detection
- Duplicate referenced `id` detection
- Invalid `aria-labelledby` references
- Duplicate `aria-labelledby` references
- Invalid `aria-describedby` references
- Duplicate `aria-describedby` references
- Common ARIA attribute misspelling detection
- Empty `aria-label` detection
- Accessible name does not include visible label detection
- Accessible-name drift review for more complex controls
- Form should be labeled detection
- Input missing label detection
- Icon-only button missing label detection

### Links and navigation behavior

- Link missing text detection
- Vague link text detection
- Ambiguous link text detection
- Duplicate link text pointing to different destinations
- Broken fragment link detection
- Broken same-origin link detection
- Richer broken-link classification where it improves the finding quality without slowing scans too much
- Link opens in new window detection
- Jump-to-location behavior for findings

### Buttons and interactive semantics

- Non-semantic button detection
- Anchor using button role detection
- Non-standard click handler detection
- Button role missing keyboard handler detection
- Button role not focusable detection
- Disabled state not announced detection

### Forms and grouped inputs

- Required field not indicated detection
- Invalid input not described detection
- More explicit review of error-message relationships when form validation is present
- Search input role missing detection
- Grouped radio and checkbox sets missing `fieldset` and `legend`

### Tables and data structure

- Table missing caption detection
- Table missing `thead` detection
- Table missing `tbody` detection
- Table header missing `scope` detection
- Table missing header cell detection
- Stronger table association analysis for complex headers and spanning cells
- Possible layout table detection

### Media and embedded content

- Missing alt text detection
- Empty alt text review
- Redundant alt text review
- Presentation role conflicting with alt text review
- Audio missing transcript detection
- Video missing captions detection
- Video missing descriptions detection
- Iframe missing title detection
- Stronger iframe and embedded-content review beyond title presence when the content is important or interactive

### Other WCAG/508 checks already wired in

- Focus indicator review
- Keyboard navigation review
- Color contrast review
- List structure review
- Motion sensitivity review
- Live region review
- Focusable element hidden from screen readers detection

### SMLC/Tzedek workflow and usability support

- `data-smlc="1"` tagging so the tool ignores its own UI
- Hidden modal and template shell exclusion where content is intentionally hidden from all users
- `Show me how to fix this` support tied to finding metadata
- Plain-English explainer text under technical issue names
- Current finding descriptions rewritten in clearer plain language for non-specialists
- Smoke-test coverage for stable checker behavior

### ANDI-style features that belong in this arena

- Actionable issue list with severity
- Jump from issue panel to source element
- Highlight target element after jump
- User-facing fix guidance attached to findings

## Current Work

No open implementation items at this time.

## Need To Do

### Remaining WCAG/508 accessibility items to add or strengthen

- None currently tracked.

### ANDI features to verify and either adopt or reject explicitly

- None currently tracked.

## Completion Standard

- We are not done when Tzedek has a large number of checks.
- We are done when every meaningful accessibility capability we care about is either implemented, actively tracked here, intentionally rejected with a reason, or replaced by a stronger Tzedek-native approach.
- ANDI-style parity matters when it improves real accessibility review. It does not matter when it is only a tool-specific behavior with no practical accessibility value.

## Validation Workflow

- Use the demo page as the fast sandbox for prototyping new issue types and isolated bad markup.
- Use the smoke fixture plus the relevant regression command as the gate once a checker is stable enough to keep.
- Prefer the demo page first when a new checker needs isolated bad HTML that would be awkward to stage on a real app page.
- Prefer the smoke fixture when the goal is to prove the rule, fix button, plain-language text, jump behavior, and self-ignore behavior keep working over time.

## Working Rule

- Treat this file as the current working checklist.
- Move items between `Completed`, `Current Work`, and `Need To Do` as the implementation changes.
- Keep WCAG/508 items and any relevant ANDI-style accessibility features together here so the status stays visible in one place.
- Treat Tzedek as the runtime owner, but tolerate the parallel CATS copy until it is safe to remove it.
- Do not create a competing tracker for the same scope. Extend this file instead.
- Keep demo, bookmarklet, extension, and any parallel runtime copies aligned when future rule or wording changes land.
- Review future ANDI-style behaviors one by one and either implement them, reject them explicitly, or replace them with a stronger Tzedek-native approach.
