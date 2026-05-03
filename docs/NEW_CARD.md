# Implementing new cards

This doc is a **short playbook** for game-state / deck tracker work. **Always follow [`AGENTS.md`](../AGENTS.md) first** (reference URLs, PR line, localization, commit format, highlights vs dynamic pools).

## 1. Reference data before Firestone logic

- Confirm card text and ids in **`hs-reference-data`** ([`cards_short.json`](https://github.com/Zero-to-Heroes/hs-reference-data/blob/master/src/cards_short.json), [`card-ids.ts`](https://github.com/Zero-to-Heroes/hs-reference-data/blob/master/src/card-ids.ts)).
- Do **not** edit generated files (repo headers say so).

## 2. Card implementation entry point (`game-state`)

- Types and patterns: [`libs/game-state/src/lib/services/cards/_card.type.ts`](libs/game-state/src/lib/services/cards/_card.type.ts) and the `_barrel.ts` in the same folder.
- At the **top of each card file**, recap the official card text / effect (see `AGENTS.md`) so reviewers can verify behavior.
- Use **`DeckState.getCurrentClass()`** when you need the current class.

### Generating vs static pools

- **Card in hand** with unknown identity → **`GeneratingCard`** + `guessInfo` (and `canBeDiscoveredBy` only when the effect is a Discover).
- **Random** effects → do **not** use the discover filter; pool can be full-format or filtered per AGENTS.
- **No card generated in hand** (e.g. summon-only) but you need a pool → **`StaticGeneratingCard`** + `dynamicPool`.
- Prefer extending the right interface over one-off hacks. See `AGENTS.md` for `canBeAnyCardClass`, `ALL_CLASSES`, `WillBeActiveCard`, etc.

## 3. Related card IDs — two different concepts

| Source                                                   | Where                                                                                                                                                                                                                         | Use                                                                                                                     |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| **Static** (tokens, summon links, “related” in DB)       | **`hs-reference-data`**: e.g. [`related-cards-data.ts`](https://github.com/Zero-to-Heroes/hs-reference-data/blob/master/src/models/reference-cards/related-cards-data.ts), merged into reference cards as `relatedCardDbfIds` | **Do not** duplicate this on the Firestone **`Card`** interface in `_card.type.ts` (that field was removed on purpose). |
| **Runtime** (modules, discover chains, log-driven links) | **`DeckCard.relatedCardIds`** on deck state                                                                                                                                                                                   | Still valid; parsers and effects attach ids as the game progresses.                                                     |

**Highlights / “global related cards”:**  
[`cards-highlight-common.service.ts`](../libs/game-state/src/lib/services/card-highlight/cards-highlight-common.service.ts) should combine **reference** relations (from `relatedCardDbfIds` via `CardsFacadeService`) with **non-empty** `DeckCard.relatedCardIds` from the matching deck entity. Treat **empty `[]`** as “no runtime list” so reference data is not accidentally suppressed (a bare `[]` default must not hide DBF-based relations).

## 4. Before ids exist in `CardIds` (patches, placeholders)

- Add placeholder string ids to **`TempCardIds`** in [`libs/shared/framework/core/src/lib/temp-card-ids.ts`](../libs/shared/framework/core/src/lib/temp-card-ids.ts) and export via the framework barrel as usual. Use the card name as the ID, suffixed with \_TEMP
- Where APIs expect **`CardIds`**, cast explicitly: `TempCardIds.SomeTemp as unknown as CardIds` at the call site. **Do not** introduce small shared helpers for this unless the team agrees; keep it local and obvious.
- Track scope and notes in a patch doc if helpful (example: [patch-35.4-mend-card-inventory.md](./patch-35.4-mend-card-inventory.md)).
- When the real id ships, prefer moving definitions to **`hs-reference-data`** and swapping `TempCardIds` usages to **`CardIds`**.

## 5. Deck tracker counters and enchantments

- If a counter sums **`GameTag.TAG_SCRIPT_DATA_NUM_1`** (or similar) on **deck enchantments**, **inline** the `filter` + `reduce` in that counter file. Avoid shared mini-helpers unless several counters truly share identical semantics.

## 6. Deck highlight selectors (`card-id-selectors`)

- **Game-state** selectors: [`libs/game-state/src/lib/services/card-highlight/card-id-selectors.ts`](../libs/game-state/src/lib/services/card-highlight/card-id-selectors.ts). (`AGENTS.md` may still point at legacy paths; if in doubt, search the repo for the card id you are adding.)
- **`reverse-minion-selectors.ts`** and related tools: keep reverse mappings consistent when you add forward selectors.
- **Sort `case` labels** in lexicographic order of the **enum member name**, i.e. as if the `CardIds.` / `TempCardIds.` prefix were not there (e.g. `HunterMend300…` before `HunterMend307…`).
- **Do not** merge distinct behaviors just to save lines: if one card needs a different selector than its neighbors (e.g. beast-only vs a whole synergy group), give it its **own** `case` / return.

## 7. Highlights “common” rules

- Category-wide behavior (Protoss, etc.): follow patterns in **`cards-highlight-common.service.ts`** instead of pasting the same selector on dozens of cards.
- Do **not** add unit tests for highlights (per `AGENTS.md`).
- Missing **selector primitives** in `selectors.ts`: **ask for guidance** instead of inventing new ones without alignment.

## 8. Sanity checks before review

- `npx nx run game-state:build` (or affected targets) clean.
- No stray references to removed helpers or wrong related-id source (static card module vs reference DB vs `DeckCard`).
- If you added user-visible strings, update **English** in `../firestone-translations/firestone/enUS.json` and use the app localization API.

## 9. Where to look in sibling repos

- Durable notes from investigations: **`knowledge/`** in the parent folder, when the stack behavior is non-obvious.
