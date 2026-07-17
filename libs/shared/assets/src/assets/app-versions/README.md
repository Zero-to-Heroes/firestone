## When creating a new version

- Use 18.3.0 as a model for sections, groupings, icons, etc.

- Only include user-facing modifications (typically this excludes all the "chore" and "DEV" commits)

- Don't build localized versions yet - wait until the default (English) version has been approved, then localize the release notes

### Localization

- **English (default)**: `{version}.md` at the root of this folder (e.g. `18.10.1.md`).

- **Other locales**: `{locale}/{version}.md` in a subfolder named after the Firestone locale code (`frFR`, `deDE`, `zhCN`, etc.).

- If a localized file does not exist, the English root file is shown instead.

- Supported locale codes match the app language settings: `deDE`, `enUS`, `esES`, `esMX`, `frFR`, `itIT`, `jaJP`, `koKR`, `plPL`, `ptBR`, `ruRU`, `thTH`, `zhCN`, `zhTW`.

- When building a localized version using auto-translate (ie for all non-English release notes), add a warning at the top that the translations are auto-generated

- When building localized release notes, also include the Discord release notes

### Card names

- Reference cards with `{{CARD_ID}}` placeholders instead of plain English names.

- Card IDs are in [card-ids.ts](https://github.com/Zero-to-Heroes/hs-reference-data/blob/master/src/card-ids.ts).

- At display time, placeholders are replaced with the localized card name from the cards database, colored by card rarity. Hovering a card name shows its card image tooltip.

- Example: `Cards discarded by {{JAIL_509}} now appear in a new section`

### Decktracker

- Highlights, pools, and oracles should each be on their separate lines. Bugs and new additions for these categories should be condensed in a single line

- Bugs and meaningful additions / changes should however each have their own line

### Discord copy

- After the English release notes are finalized, run `npm run generate-discord-release-notes` (defaults to the version in `package.json`).

- This writes a copy-paste-ready file to `discord/{version}.txt` with card placeholders resolved to English card names and section headers formatted for Discord.

- The same command runs automatically as part of `release:phase1` and `release:all`.

- Use `npm run generate-discord-release-notes -- --all` to regenerate every English release notes file.
