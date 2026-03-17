<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# Project instructions

## When Tickets are assigned to you

General guidelines:

- In order for me to check that you have correctly read this, please add an "I have read the AGENTS.md file before starting" line at the top of the PR explanation in GitHub
- When cards are mentioned, always check the reference at https://github.com/Zero-to-Heroes/hs-reference-data/blob/master/src/cards_short.json
- Recap their text / effects at the top of the file that implements the card. This will help you make sure you're implementing the card correctly, and will help the reviewer understand what you're doing
- Do not touch files that are flagged as automatically generated (there is a comment in the header)
- Card IDs are at https://github.com/Zero-to-Heroes/hs-reference-data/blob/master/src/card-ids.ts

Once you're done, before assigning the PR to me for review, please mention @cursoragent for it to do a first review.

### Card highlight requests

- First check the requested cards at https://github.com/Zero-to-Heroes/hs-reference-data/blob/master/src/cards_short.json and decides whether the request makes sense based on what the card does
- Selectors are defined in https://github.com/Zero-to-Heroes/firestone/blob/master/libs/legacy/feature-shell/src/lib/js/services/decktracker/card-highlight/card-id-selectors.ts
- If the required selectors are missing (in https://github.com/Zero-to-Heroes/firestone/blob/master/libs/legacy/feature-shell/src/lib/js/services/decktracker/card-highlight/selectors.ts), don't implement them yourself, and ask for guidance
- When highlights concern a whole category of cards (eg Protoss), don't add highlights to every single card of that category, but look at what is done in https://github.com/Zero-to-Heroes/firestone/blob/master/libs/legacy/feature-shell/src/lib/js/services/decktracker/card-highlight/cards-highlight-common.service.ts

### Dynamic pool requests

- First check the requested cards at https://github.com/Zero-to-Heroes/hs-reference-data/blob/master/src/cards_short.json and decides whether the request makes sense based on what the card does
- https://github.com/Zero-to-Heroes/firestone/blob/master/libs/game-state/src/lib/services/cards/_card.type.ts is the entry point, as well as the \_barrel.ts in the same folder
- If the card generates another card in hand, the "guessInfo" from GeneratingCard should be implemented
    - If the card text mentions a "discover", then it needs to use the "canBeDiscoveredBy" filter. If it's random, this filter should not be used, as it draws from the full pool of cards
- If not, and the card still requires a dynamic pool (like summons a minion, so nothing generated in hand), the card should extend the StaticGeneratingCard interface
- _Don't use the deprecated \_register card entry point_

### Common considerations

- When you want to get the current class, use DeckState.getCurrentClass()

## Global bugs

- The app's main repo is this one
- The log parser is at ..\hs-game-converter-csharp-port
- The reference cards are at ..\hs-reference-data\src\cards_short.json

# General Guidelines for working with Nx

- For navigating/exploring the workspace, invoke the `nx-workspace` skill first - it has patterns for querying projects, targets, and dependencies
- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- Prefix nx commands with the workspace's package manager (e.g., `pnpm nx build`, `npm exec nx test`) - avoids using globally installed CLI
- You have access to the Nx MCP server and its tools, use them to help the user
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.
- NEVER guess CLI flags - always check nx_docs or `--help` first when unsure

## Scaffolding & Generators

- For scaffolding tasks (creating apps, libs, project structure, setup), ALWAYS invoke the `nx-generate` skill FIRST before exploring or calling MCP tools

## When to use nx_docs

- USE for: advanced config options, unfamiliar flags, migration guides, plugin configuration, edge cases
- DON'T USE for: basic generator syntax (`nx g @nx/react:app`), standard commands, things you already know
- The `nx-generate` skill handles generator discovery internally - don't call nx_docs just to look up generator syntax

<!-- nx configuration end-->
