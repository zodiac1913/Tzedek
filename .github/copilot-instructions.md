# Tzedek Repo Instructions

- Never remove the GitHub repository link from the center navbar version pill in the Tzedek audit UI.
- Preserve that version pill as a link to the Tzedek GitHub repository unless the user explicitly asks to change it.
- The navbar version pill link must always include the title attribute `Click to see the GitHub repo`.

## Repository Sync Boundary

- In a Tzedek-scoped session, perform Git operations only in the Tzedek repository.
- When the user asks to sync with GitHub, fetch, pull, commit, or push only Tzedek. Never run Git operations against the separate CATS repository, including through `git -C` or an absolute CATS path.
- After every Tzedek runtime change, publish the authoritative `src/runtime` files into CATS with `npm run cats:sync`, then confirm parity with `npm run verify:cats` so the integrated CATS application receives the change.
- Tzedek may update only the generated CATS runtime mirror through the Tzedek synchronization scripts. Never make hand edits elsewhere in CATS, never alter CATS instruction files, and never run CATS Git operations.
- CATS must not implement Tzedek product changes or push code to the Tzedek repository. Tzedek owns its source, publishes its generated runtime mirror into CATS, and performs Git operations only for Tzedek.
