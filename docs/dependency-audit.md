# Tzedek Dependency Audit

Date: 2026-07-29

## Scope

This audit checks the imported standalone runtime in:

- `src/runtime/smlCompliance.js`
- `src/runtime/smlComplianceRunner.js`

Goal:

- identify actual SML dependencies
- identify actual CSS surface used by the generated Tzedek UI
- separate required runtime dependencies from parity-only or guidance-only references

## Summary

Current conclusion:

1. Tzedek does not currently show evidence of a hard direct JavaScript dependency on `sml.js` for core execution.
2. Tzedek does recognize Small-Mighty-Light page structures and wrappers through selectors such as `cc-container`, `sml-page`, and `sml-form-field`.
3. Tzedek currently emits Bootstrap or CatsStrap-style class names in its generated UI, so it still benefits from external theme CSS unless those classes are replaced or inlined.
4. Tzedek references `sml.css` and CatsStrap-derived replacements in user guidance text for contrast suggestions, even where it does not directly import those files.
5. `site.css` is not currently confirmed as a direct runtime dependency.

## Direct SML Runtime Selectors Found

Confirmed selectors in the imported runtime:

- `containerSelector: "cc-container, sml-page"`
- jump target lookup includes `cc-container, sml-page`
- wrapper lookup uses `closest("sml-form-field, .form-floating, .form-group, .modal-header, td, th, li")`

Interpretation:

- Tzedek is aware of SML page structures.
- That is not the same as importing or requiring `sml.js`.
- These selectors improve behavior on SML pages and should be preserved unless a stronger standalone abstraction replaces them.

## Direct JavaScript Dependency Findings

No direct evidence was found in the imported runtime of:

- importing `sml.js`
- calling SML helper APIs such as `modalBox` or `jmlToHtml`
- invoking `customElements` registration from Tzedek runtime files

Current judgment:

- `sml.js` appears to be optional for core Tzedek execution on arbitrary pages
- `sml.js` may still matter for parity fixtures, custom-element pages, or future Small-Mighty-Light-specific integration support

## Generated Runtime UI Class Surface

Confirmed class strings emitted by the imported runtime include:

### Tzedek-owned classes

- `sml-compliance-alert`
- `sml-compliance-alert-toggle`
- `sml-compliance-alert-panes`
- `sml-compliance-alert-pane`
- `sml-compliance-plain`
- `sml-compliance-more-info`
- `sml-compliance-fix-modal-backdrop`
- `sml-compliance-fix-modal`
- `sml-compliance-fix-modal-head`
- `sml-compliance-fix-modal-body`
- `sml-compliance-fix-modal-foot`
- `sml-compliance-btn`
- `sml-compliance-fix-btn`
- `sml-compliance-fix-actions`

These are mostly styled by the runtime's injected stylesheet.

### External utility or theme classes still emitted

- `btn`
- `btn-sm`
- `btn-secondary`
- `btn-dark`
- `btn-info`
- dynamic button classes returned by `getBootstrapButtonClassForLevel(...)`
- `my-0`
- `mx-0`
- `p-3`
- `rounded`
- `mb-0`
- `mt-2`
- `mb-1`
- `fw-bold`

### Alert/theme classes referenced through alert severity mapping

- `alert`
- `bg-danger`
- `bg-warning`
- `bg-info`
- `bg-success`
- `text-white`
- `border`
- `border-3`
- `border-danger`
- `border-warning`
- `border-info`
- `border-success`
- `shadow-lg`

Interpretation:

- Tzedek currently carries much of its own component styling.
- It still relies on Bootstrap or CatsStrap-style utility and semantic classes for parts of the rendered UI.
- A future `Tzedek.css` likely needs at least a small preserved subset of these classes unless the runtime is refactored to remove them.

## Guidance-Only CSS References

Confirmed contrast guidance strings include:

- `Bootstrap button replacements`
- `sml.css button replacements`
- `legacy theme` replacements derived from the former CatsStrap palette layer

Interpretation:

- `sml.css` and CatsStrap are not just styling concerns; they currently inform fix suggestions shown to users.
- Removing those concepts entirely would change the product's remediation guidance, not just its look.

## Demo And Fixture Findings

Observed fixture behavior:

- parity fixtures explicitly load `catsStrap.css`
- smoke and demo support assets include `smoke.png`

Implication:

- demo parity currently assumes access to CatsStrap-derived styling
- that does not prove Tzedek needs all of CatsStrap, only that parity pages still use it

## Current Recommendation

### Keep

1. structural SML selectors such as `cc-container`, `sml-page`, and `sml-form-field`
2. contrast suggestion support for Bootstrap, SML, and legacy theme replacements
3. the current imported smoke asset and self-owned runtime styles

### Treat As Optional For Core Runtime, But Not Yet Safe To Drop Everywhere

1. `sml.js`
2. `sml.css`
3. large unused portions of CatsStrap-derived CSS

### Next Reduction Target

The safest next trimming step is not JavaScript removal first. It is CSS surface analysis:

1. identify the exact utility and button classes required by the emitted Tzedek UI
2. preserve the theme and palette pieces used by contrast replacement guidance
3. assemble the first standalone `Tzedek.css` candidate from CatsStrap plus any required SML rules

## Bottom Line

At this stage:

- Tzedek appears to be SML-aware more than SML-execution-dependent
- Tzedek is more dependent on Bootstrap or CatsStrap-style CSS semantics than on `sml.js`
- pruning should start with proven-unused CSS and only later move into imported JS trimming
