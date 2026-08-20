# Tzedek Repo Instructions

- Never remove the GitHub repository link from the center navbar version pill in the Tzedek audit UI.
- Preserve that version pill as a link to the Tzedek GitHub repository unless the user explicitly asks to change it.
- The navbar version pill link must always include the title attribute `Click to see the GitHub repo`.

## Repository Sync Boundary

- In a Tzedek-scoped session, perform Git operations only in the Tzedek repository.
- When the user asks to sync with GitHub, fetch, pull, commit, or push only Tzedek. Never run Git operations against the separate CATS repository, including through `git -C` or an absolute CATS path.
- Do not synchronize Tzedek files into CATS from a Tzedek-scoped session. Leave CATS pulls, commits, pushes, and Tzedek runtime imports to a separate CATS-scoped session.
- Do not inspect or alter CATS working-tree state as part of a Tzedek sync. If CATS also needs synchronization, tell the user to ask CATS to sync its own repository.
