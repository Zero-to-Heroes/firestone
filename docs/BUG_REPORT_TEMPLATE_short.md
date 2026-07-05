Thoroughly read the following instructions:

# Bug report playbook (deck tracker / game-state)

Use this when investigating a **decktracker or parser** bug backed by a **power.log**. Replace `<slug>` everywhere (short id, e.g. `ivory`, `torch`, `blackwing`)—no spaces.

---

## What the reporter should attach

- **Game logs**: `power.log` file, already truncated to reproduce the issue in the game UI
- **App logs** (optional): `.app.zip` if UI or crashes matter.
- **FullMessage** or short description of wrong vs expected behavior.

---

## 2. Prepare the power.log fixture

1. Save under the bug folder (spec + log live together):  
   **`test-tools/bugs/<bug-id>/<name>.log`** (e.g. `test-tools/bugs/blackwing/blackwing.log`)  
   Map the slug to this path in `DEFAULT_BUG_LOG_BY_SLUG` inside `test-tools/lib/power-log-replay-harness.ts`, or use `<slug>/<slug>.log` under `test-tools/bugs/` and pass that slug to `resolvePowerLogPathForSlug`.

---

## 3. Add a regression test (game-state replay)

Goal: replay the log through the **same path as the app** (`GameEvents.receiveLogLine` → `GameStateService`) and assert on **final `GameState`**.  
The initial test should fail, to prove that the bug can indeed be reproduced.
Do don't manual unit tests - all tests should work from the provided power.log file
The final assertion should closely match the reported issue (for instance, if the issue says "only 3 triangulate cards appear in the deck and it should be 4", the assertion should check for 4 Triangulate cards in the deck)

1. **Shared harness** (reuse; do not duplicate):  
   `test-tools/lib/power-log-replay-harness.ts`
    - `resolveCardsJsonPath()` — `cards_short.json` from sibling `hs-reference-data`, or set `HS_REFERENCE_CARDS_JSON_PATH` to a local path or to the **raw** JSON URL  
      `https://raw.githubusercontent.com/Zero-to-Heroes/hs-reference-data/master/src/cards_short.json`  
      (a GitHub **blob** link from the repo browser is accepted and normalized to that raw URL). See `HS_REFERENCE_CARDS_SHORT_RAW_URL` in the harness.
    - `resolvePowerLogPathForSlug('<slug>')` — default `test-tools/bugs/...` per `DEFAULT_BUG_LOG_BY_SLUG`; overrides: `POWER_LOG_<SLUG>_PATH`, or legacy envs like `IVORY_POWER_LOG_PATH` / `TORCH_POWER_LOG_PATH` (see `LEGACY_ENV_BY_SLUG` in the harness).
    - `replayPowerLogToGameState({ logPath, reviewId?, settleMs? })` — returns `{ allCardsRef, state, gameStateService }`.
    - `collectAllDeckCards(state)` — hand + deck + board + otherZone + deckList for both players.

2. **New spec file** (next to the log under `test-tools/bugs/<bug-id>/`):  
   `test-tools/bugs/<bug-id>/power-log-<slug>-replay.spec.ts`
    - Mirror **Ivory** (`test-tools/bugs/ivory-rook/power-log-ivory-rook-replay.spec.ts`) or **Torch** (`test-tools/bugs/torch/power-log-torch-replay.spec.ts`) for structure.
    - Prefer **small helpers** in the same folder for slug-specific parsing from raw log lines (e.g. armor delta, `TAG_SCRIPT_DATA_NUM_1`) so expected values are **grounded in the fixture**, not guessed.
    - The test should always start from a log file - no unit or mock tests!

3. **Run** (always **in-band**; harness uses `setAppInjector`):

    ```bash
    export HS_REFERENCE_CARDS_JSON_PATH=https://raw.githubusercontent.com/Zero-to-Heroes/hs-reference-data/master/src/cards_short.json
    npx jest test-tools/bugs/<bug-id>/power-log-<slug>-replay.spec.ts --config=libs/game-state/jest.config.ts --runInBand
    ```

    Or all power-log replay specs:

    ```bash
    npx jest --testPathPattern="power-log-.*-replay\\.spec" --config=libs/game-state/jest.config.ts --runInBand
    ```

4. **Multi-suite runs**: `resetAppInjectorForTesting()` in `app-injector.ts` exists so several replay specs can run in one Jest process—handled inside the harness; avoid duplicating `setAppInjector` in specs.

---

## 4. Where to fix product code (typical)

| Area                        | Location                                                                         |
| --------------------------- | -------------------------------------------------------------------------------- |
| Raw log → structured events | `libs/power-log-parser` (e.g. `receive-card-in-hand-parser`, `oracle`)           |
| Event → deck state          | `libs/game-state/src/lib/services/game-events/event-parser/`                     |
| Card-specific guess / pools | `libs/game-state/src/lib/services/cards/<card>.ts`                               |
| Reference data              | `hs-reference-data` (`cards_short.json`, `card-ids.ts`) — see root **AGENTS.md** |

Propose the fix (or failing assertion) **before** large refactors; keep changes scoped to the bug.

---

## 5. PR / review

- Follow **AGENTS.md** (Firestone + `.github/AGENTS.md` if linked): cards from reference data, no edits to auto-generated files, etc.

# Actual bug report below

Please stop after building the red test (including the truncated power.log) so I can reproduce the issue myself in the UI
