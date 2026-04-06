IMPORTANT! Please make sure you work in a worktree, as per the instructions below! This should be the first thing you do

Thoroughly read the following instructions:

# Bug report playbook (deck tracker / game-state)

Use this when investigating a **decktracker or parser** bug backed by a **power.log**. Replace `<slug>` everywhere (short id, e.g. `ivory`, `torch`, `blackwing`)—no spaces.

---

## What the reporter should attach

- **Game logs**: `.power.zip` from support (contains `power.log`).
- **App logs** (optional): `.app.zip` if UI or crashes matter.
- **FullMessage** or short description of wrong vs expected behavior.

---

## 1. Isolate work (parallel agents), if asked

1. Use a **git worktree** so you do not clash with other agents:
    - From repo root:  
      `git worktree add ../.worktrees/bug-<slug>/firestone -b bug/<slug>`
    - Do all reads/edits in that worktree until merge.
2. Wait until I tell you to merge! The code needs to be complete, and the new test needs to be passing before I can give you the green light
3. After merge:
    - `git worktree remove ../.worktrees/bug-<slug>/firestone`
    - remove the debug configuration in launch.json
    - delete temporary .zip files you have downloaded

---

## 2. Prepare the power.log fixture

1. Download the **Game logs** zip from the URL, extract `power.log`.
2. **Trim to the last game only** (multi-game files are common): use `trimPowerLogLinesToLastGame` in `test-tools/lib/trim-power-log-last-game.ts`. It keeps from the last **GameState** `DebugPrintPower() - CREATE_GAME` line, or—if that stream is missing—from the last **PowerTaskList** `DebugPrintPower()` line containing `CREATE_GAME`, **through end of file** with no lines removed in between (all `GameState` and `PowerTaskList` lines in that range stay).
3. Save under the bug folder (spec + log live together):  
   **`test-tools/bugs/<bug-id>/<name>.log`** (e.g. `test-tools/bugs/blackwing/blackwing.log`)  
   Map the slug to this path in `DEFAULT_BUG_LOG_BY_SLUG` inside `test-tools/lib/power-log-replay-harness.ts`, or use `<slug>/<slug>.log` under `test-tools/bugs/` and pass that slug to `resolvePowerLogPathForSlug`.
4. Explain why the initial report is indeed a bug. You should do this by looking into the power.log, then understand what happens in the game, and why the report mentions that the expected behavior doesn't match what actually happens in game
5. If possible: truncate after the relevant sequence (e.g. stop after a key `PowerTaskList` block) to keep the fixture small—document why in the spec.
    - It not possible, **please say so** and don't continue

---

## 3. Add a regression test (game-state replay)

Goal: replay the log through the **same path as the app** (`GameEvents.receiveLogLine` → `GameStateService`) and assert on **final `GameState`**.  
The initial test should fail, to prove that the bug can indeed be reproduced.
Do don't manual unit tests - all tests should work from the provided power.log file

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

4. **Debug in VS Code**: `.vscode/launch.json` includes **Jest: debug … power-log replay (game-state)** entries; add one for your slug if you debug often.

5. **Multi-suite runs**: `resetAppInjectorForTesting()` in `app-injector.ts` exists so several replay specs can run in one Jest process—handled inside the harness; avoid duplicating `setAppInjector` in specs.

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
- Mention **@cursoragent** for a first review when ready.

---

## Example request text (paste for a new agent)

```text
FullMessage: <one-line summary>

App logs: <https://s3-.../....app.zip>
Game logs: <https://s3-.../....power.zip>

In docs/BUG_REPORT_TEMPLATE.md, replace "<slug>" with "<your-slug>".

Please download the Game logs zip, extract power.log, trim to the last game, save as
test-tools/bugs/<bug-id>/<name>.log (with spec + helpers in the same folder), add a power-log-<slug>-replay.spec.ts using the shared
test-tools/lib/power-log-replay-harness, and drive a fix for <expected behavior>.
Also check AGENTS.md.
```

---

## Workspace isolation (strict mode)

When the assignee must **never touch the main checkout**:

1. Create worktree:  
   `git worktree add ../.worktrees/bug-<slug>/firestone -b bug/<slug>`
2. Copy the prepared bug folder into the worktree if needed:  
   `cp -r test-tools/bugs/<bug-id> ../.worktrees/bug-<slug>/firestone/test-tools/bugs/`
3. Perform **all** file work inside `../.worktrees/bug-<slug>/firestone/`.
4. Report branch name `bug/<slug>` for review/merge.

# Actual bug report below
