# Dungeon Run achievement UI grouping vs boss victories

## Context

Logs can reference `dungeon_run_boss_victory_LOOTA_BOSS_18h` while the user expects progress under **Dungeon Run progression – Paladin** in the achievements UI.

## Static data (dungeon_run.json on static.zerotoheroes.com)

- **`dungeon_run_boss_victory_LOOTA_BOSS_18h`** (“Giant Rat”) uses **`type`: `dungeon_run_boss_LOOTA_BOSS_18h`**. It is **`root`: false**.
- **Paladin dungeon progression** rows use **`type`: `dungeon_run_progression_HERO_04`** (e.g. `dungeon_run_progression_HERO_04_0`), **`PLAYER_HERO` `HERO_04`**, **`DUNGEON_RUN_STEP`** + **`GAME_WON`**.

These **`type` values differ**. `AchievementsStateManagerService` builds completion steps by grouping all definitions that share the same `type`. A boss-victory completion therefore appears under the **boss victory series for that opponent**, not under the Paladin progression chain.

## Product implication

Boss defeat achievements **do not** advance Paladin progression in data or UI: they are different achievement rows and different `type` chains. Expect Giant Rat progress under the boss-related grouping, not under **Dungeon Run progression – Paladin**.

## Raw requirements (why detection differs)

### `dungeon_run_boss_victory_LOOTA_BOSS_18h` (boss victory)

- `CORRECT_OPPONENT` → `LOOTA_BOSS_18h` (fires on `OPPONENT` events)
- `GAME_WON`
- `SCENARIO_IDS` → `2663` (Kobolds dungeon run scenario)

No dungeon-round index is required.

### `dungeon_run_progression_HERO_04_0` (Paladin – cleared round 1)

- `DUNGEON_RUN_STEP` → `"0"` — expects `GameEvent.DUNGEON_RUN_STEP` with `additionalData.step === 0`
- `GAME_WON`
- `PLAYER_HERO` → `HERO_04` (`LOCAL_PLAYER`; hero `CardID` must contain `HERO_04`)
- `SCENARIO_IDS` → `2663`

Progression **depends on `DUNGEON_RUN_STEP`** being emitted by the parser. In [`game-events.service.ts`](libs/game-state/src/lib/services/game-events/game-events.service.ts), payload uses **`step: gameEvent.Value - 1`** (HS value is treated as 1-based).

### `DungeonRunStepReq` behavior

Previously the requirement locked on the **first** `DUNGEON_RUN_STEP` event even when `step !== targetStep`, which could permanently leave `isCorrectStep === false`. It now sets completion only when **`additionalData.step === targetStep`**, ignoring non-matching rounds until the correct step appears.

## Related code fixes

- Unlock debug logs distinguish skip reasons (`alreadyCompleteInStorage`, `alreadyCompleteInDefinition`, `noDefinition`) from `processing unlock event`, and trace persist/publish/enqueue targets.
- `publishRemoteAchievement` updates `remoteAchievements$$` / disk cache without a logged-in user so grouped achievements UI can refresh offline; remote POST remains gated on user.
