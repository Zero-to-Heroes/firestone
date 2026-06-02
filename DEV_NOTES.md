## Test accounts

- sebTesterPaid / testerpaid@sebastien.tromp.fr / squall007
- sebTesterFree / testerfree@sebastien.tromp.fr / squall007

## Electron

- App version: bump root `package.json` only; release with `npm run full-publish:ow-electron` (see CONTRIBUTING.md **App version**).
- Release a premium-only app, that has no ads at all, so no need for consent management. Check at startup, and if user is not premium, show an error and redirect to the correct app
- Add way to release a new app (I manually add a tag, and it publishes a new app?)
- Add other version with ads (which also supports authenticating)
- Includes support for the loading window
- Update the dow
- Add other OAuth providers
- bug report
