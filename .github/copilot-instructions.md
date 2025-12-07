## When Tickets are assigned to you

### Card highlight requests

- First check the requested cards at https://github.com/Zero-to-Heroes/hs-reference-data/blob/master/src/cards_short.json and decides whether the request makes sense based on what the card does
- Selectors are defined in https://github.com/Zero-to-Heroes/firestone/blob/master/libs/legacy/feature-shell/src/lib/js/services/decktracker/card-highlight/card-id-selectors.ts
- If the required selectors are missing (in https://github.com/Zero-to-Heroes/firestone/blob/master/libs/legacy/feature-shell/src/lib/js/services/decktracker/card-highlight/selectors.ts), don't implement them yourself, and ask for guidance

### Dynamic pool requests

- First check the requested cards at https://github.com/Zero-to-Heroes/hs-reference-data/blob/master/src/cards_short.json and decides whether the request makes sense based on what the card does
- https://github.com/Zero-to-Heroes/firestone/blob/master/libs/game-state/src/lib/services/cards/_card.type.ts is the entry point, as well as the \_barrel.ts in the same folder
- If the card generates another card in hand, the "guessInfo" from GeneratingCard should be implemented
- If not, and the card still requires a dynamic pool (like summons a minion, so nothing generated in hand), the card should extend the StaticGeneratingCard interface
