# WCAG 508 Compliance Checklist

Date: 2026-07-29
Scope: `src/runtime/smlCompliance.js`, `src/runtime/smlComplianceRunner.js`, `demo/`, `bookmarklet/`, and any synced runtime consumers that ship Tzedek behavior
Purpose: Keep one working checklist of accessibility items that are completed, actively being refined, or still need to be added. Move items between sections as work lands.
Primary tracker: This file is the single source of truth for Tzedek accessibility status, including WCAG, Section 508, and relevant ANDI-style parity work.

Status: Feature-complete for the currently tracked WCAG/508 checks. ANDI-style parity is only partial as of 2026-08-10 and remains an active planning area.

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

### ANDI parity audit and delivery plan

- Tzedek already covers several ANDI-style outcomes: actionable issue list with severity, jump-to-element behavior, target highlighting, fix guidance, and many core detectors for links, labels, tables, images, landmarks, live regions, contrast, and iframes.
- Tzedek does not yet provide full ANDI-style module parity. Several ANDI capabilities are still missing entirely, and others exist only as detectors without the module-specific inspection UI that makes ANDI useful during manual review.

### Tzedek-way rules for parity work

- Do not copy ANDI just because ANDI has a feature.
- Prefer detector-first and fix-first workflows over browsing and toy-style exploratory tooling.
- Keep features that help users answer one of two questions quickly: `what is wrong?` and `how do I fix it?`
- If Tzedek already detects and explains a problem well, do not add extra inventory or overlay UI unless it materially improves triage speed.
- Prefer strong defaults and practical suggestions over playground-style controls. Example: sensible contrast suggestions are in scope; a freeform color toy is not required.
- Adopt reviewer-assist features only when they expose information that the detector layer cannot communicate clearly by itself.
- Do not rebuild general-purpose browser inspector behavior inside Tzedek when browser developer tools already cover that ground.

### Highest-priority ANDI feature gaps

- Module launcher and scoped inspection modes comparable to ANDI, especially focusable elements, links/buttons, structures, graphics/images, tables, hidden content, color contrast, and iframes.
- Table inspection workflow where it improves diagnosis of complex tables: cell-to-header inspection output and optional association visualization for spanning or grouped headers.
- Structure inspection workflow: headings list, lists mode, landmarks mode, live-region mode, reading-order overlay, and role/lang attribute overlays.
- Graphics and hidden-content inspection helpers: background-image discovery, decorative-image highlighting, font-icon discovery, hidden-content reveal toggles, and CSS generated-content inspection.
- Iframe inventory and independent-open workflow for testing iframe contents in a new tab.
- Tester productivity features that ANDI relies on during manual review: accesskey list, tab-order overlay, title-attribute overlay, label-tag overlay, hotkeys, hover lock, and refresh behavior that preserves useful context.

### Next Tzedek-first improvements

- Sharpen issue wording whenever an alert still feels harder to understand than it should.
- Add issue-specific helpers only for families where the alert and fix text are still not enough, such as complex ARIA reference chains, tricky accessible-name mismatches, and complex tables.
- Build the parity matrix with explicit `keep`, `optional`, and `reject` decisions so future work does not drift back toward generic inspector tooling.

### Likely low-value or optional ANDI parity items

- Full link and button inventory views are lower priority than stronger detectors and better element-targeted fix guidance.
- One-table-at-a-time browsing is not required if issue-targeted popups and element jumps already make the broken table easy to inspect.
- Freeform color-playground behavior is not a parity goal unless a narrowly scoped Tzedek-native variant proves useful during real remediation work.
- Hidden-content reveal tooling is optional unless it exposes accessibility-relevant content that Tzedek cannot already classify clearly from the DOM.
- Background-image, decorative-image, and font-icon helpers should be evaluated as diagnosis aids, not adopted blindly as parity items.

### Intentionally rejected as a general Tzedek feature

- A generic active-element inspector comparable to ANDI's main element-output mode. Reason: Tzedek is issue-first and fix-first, and browser developer tools already handle generic element inspection better.
- Generic previous/next analyzed-element browsing as a primary workflow. Reason: Tzedek should move users to actual findings, not encourage page wandering when there is nothing to fix.

## Need To Do

### Remaining WCAG/508 accessibility items to add or strengthen

- None currently tracked.

### ANDI features to verify and either adopt or reject explicitly

- Build an explicit ANDI parity matrix and keep it here until the work is closed.
- Mark each ANDI feature as one of: `implemented`, `partial`, `planned`, or `intentionally rejected`.
- Use the Tzedek-way rules above when deciding whether a feature belongs in `planned` or `intentionally rejected`.

### ANDI parity implementation plan

- Phase 1: Build the parity matrix and make keep/optional/reject decisions explicit.
	Add a feature-by-feature inventory for ANDI modules and controls, map each item to current Tzedek behavior, and mark whether Tzedek should keep it, treat it as optional, or reject it.
- Phase 2: Close the default ANDI/focusable-elements gaps that materially improve diagnosis.
	Add accesskey inventory, tab-order overlay, title-attribute overlay, label-tag overlay, and any missing focusable-element review helpers that depend on the new inspection shell.
- Phase 3: Close links/buttons and structures parity.
	Prioritize ambiguous-link and non-unique-button workflows, headings/list/landmark/live-region browsing, reading-order overlays, and role/lang overlays. Treat broad link/button inventory views as optional unless user testing proves they speed up remediation.
- Phase 4: Close tables, graphics, hidden-content, and iframe parity.
	Add only the parts that materially improve diagnosis: complex-table association inspection, optional table association visualization, background-image and decorative-image helpers if they expose missing alternatives, font-icon discovery when icons participate in naming or meaning, generated-content inspection, and iframe inventory/open-in-new-tab helpers. Hidden-content reveal tooling stays optional pending proof of value.
- Phase 5: Finish cANDI-style review polish.
	Verify contrast workflows against real remediation needs, including manual-test-needed messaging, inspector details for the current element, and suggestion quality. Do not add freeform color-playground behavior unless a strong Tzedek-native reason emerges.
- Phase 6: Validate parity and prune low-value mismatches.
	For each ANDI feature, decide whether Tzedek should match it exactly, replace it with a stronger Tzedek-native workflow, or reject it with a written reason. Do not leave silent gaps.

### Definition of done for ANDI parity

- Every ANDI feature is listed in this tracker.
- Every listed feature is mapped to `implemented`, `partial`, `planned`, or `intentionally rejected`.
- Every `planned` item has an owning phase or follow-up issue.
- Every `intentionally rejected` item has a short reason explaining why Tzedek should not copy it.
- The bookmarklet and extension share the same parity behavior unless a browser limitation forces a documented exception.

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
