# More Info Excuse

## Purpose

This file is not a general policy note. It is an audit of the current ARIA-related findings in Tzedek and a record of which ones still do not resolve cleanly to a specific `More Info` destination.

The standard is simple:

- if a finding is about a specific ARIA attribute, link to that exact ARIA attribute page
- if a finding is about a specific ARIA role, link to that exact ARIA role page
- if a finding does not currently do that, explain exactly why

## Audited ARIA-Related Findings

### Already resolved to a specific external page

- `Empty ARIA Label`: resolves to the specific `aria-label` reference page
- `Invalid aria-labelledby Reference`: resolves to the specific `aria-labelledby` reference page
- `Duplicate aria-labelledby Reference`: resolves to the specific `aria-labelledby` reference page
- `Invalid aria-describedby Reference`: resolves to the specific `aria-describedby` reference page
- `Duplicate aria-describedby Reference`: resolves to the specific `aria-describedby` reference page
- `Focusable Element Hidden From Screen Readers`: resolves to the specific `aria-hidden` reference page
- `ARIA Attribute Misspelled`: now resolves to the specific intended ARIA attribute page by parsing the suggested correction from the finding message
- `Invalid aria-level Value`: resolves to the specific `aria-level` reference page
- `Invalid aria-live Value`: resolves to the specific `aria-live` reference page
- `Live Region Should Have aria-atomic`: resolves to the specific `aria-atomic` reference page
- `Consider ARIA Heading Roles`: resolves to the specific `heading` role reference page
- `Heading Role Missing aria-level`: now resolves to the specific `heading` role reference page through the direct title mapping
- `Search Input Role Missing`: resolves to the specific `searchbox` role reference page
- `Missing Navigation Landmark`: resolves to the specific `navigation` role reference page
- `Missing Main Landmark`: resolves to the specific `main` role reference page
- `Custom Navigation Container Missing Landmark`: resolves to the specific `navigation` role reference page
- `Custom Main Content Container Missing Landmark`: resolves to the specific `main` role reference page
- `Button Role Missing Keyboard Handler`: resolves to the specific `button` role reference page
- `Button Role Not Focusable`: resolves to the specific `button` role reference page
- `Disabled State Not Announced`: now resolves to the specific `aria-disabled` reference page

### Resolved externally, but not as specifically as they should be

- `Invalid Role Value`: this now has two behaviors. When the finding includes a concrete replacement such as `role="image"` needing `role="img"`, the resolver can send users to the exact suggested ARIA role page. For other invalid role tokens, it still falls back to the generic MDN ARIA roles reference index because there is no valid exact role page for an invalid token.

### Findings that still need a better explanation because the current `More Info` behavior is not good enough

- None currently in the ARIA-focused set, beyond the narrower `Invalid Role Value` limitation described above.

## Why These Gaps Do Not Justify A Local Replacement Reference

- For `Invalid Role Value`, a local page would still not become the canonical source for valid ARIA roles. The best local contribution would be a Tzedek note about how the invalid token was detected, not a replacement for ARIA reference material.

## Why We Cannot Treat A Local Doc As The Primary Fix

- Local docs are not authoritative for ARIA semantics.
- Local docs will drift faster than MDN or W3C references.
- The unresolved items above are runtime mapping problems, not documentation-hosting problems.
- The right long-term fix is better title-to-URL resolution, not more repo-local accessibility theory.

## Bottom Line

After reviewing the ARIA-related findings currently in the runtime, the only remaining imperfect `More Info` case is `Invalid Role Value` when the runtime cannot infer a valid replacement role from the message.

Everything else in the current ARIA-focused set now reaches a specific external documentation page or a deliberately chosen canonical external page.