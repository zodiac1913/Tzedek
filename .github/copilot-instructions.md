# Tzedek Repo Instructions

- Never remove the GitHub repository link from the center navbar version pill in the Tzedek audit UI.
- Preserve that version pill as a link to the Tzedek GitHub repository unless the user explicitly asks to change it.
- The navbar version pill link must always include the title attribute `Click to see the GitHub repo`.

## Source And Deployment Boundary

- In a Tzedek-scoped session, perform Git operations only in the Tzedek repository.
- When the user asks to sync with GitHub, fetch, pull, commit, or push only Tzedek. Never run Git operations against the separate CATS repository, including through `git -C` or an absolute CATS path.
- The authoritative Tzedek source is this repository, especially `src/runtime`. CATS copies of Tzedek files are legacy artifacts, not a source, deployment target, or required sync destination. Do not run `npm run cats:sync` or `npm run verify:cats` for routine Tzedek changes.
- `tzedek.dirtsailor.org` deploys by requesting the latest published Tzedek GitHub release from its own server. The server-side `scripts/deploy-runtime-to-nginx.sh` pulls and installs the released runtime into that server's served workspace; Tzedek does not push runtime files directly to the live site.
- For runtime changes, update `src/runtime` and the relevant packaged copies/build outputs in this repository, validate them, and publish a GitHub release before expecting the public server to receive them. A server pull deploys the release, not uncommitted local changes.
- A future `cms.gov` deployment would be a separate hosting target with its own explicitly documented deployment flow. Do not assume it should sync through CATS or change the `tzedek.dirtsailor.org` release-pull flow.
- Never make hand edits in CATS, alter CATS instruction files, or run CATS Git operations as part of Tzedek work. CATS must not implement Tzedek product changes or push code to the Tzedek repository.
