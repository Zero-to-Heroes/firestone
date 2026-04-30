# Dungeon Run achievement UI grouping vs boss victories

## Context

Logs can reference `dungeon_run_boss_victory_LOOTA_BOSS_18h` while the user expects progress under **Dungeon Run progression – Paladin** in the achievements UI.

## Static data (dungeon_run.json on static.zerotoheroes.com)

- **`dungeon_run_boss_victory_LOOTA_BOSS_18h`** (“Giant Rat”) uses **`type`: `dungeon_run_boss_LOOTA_BOSS_18h`**. It is **`root`: false**.
- **Paladin dungeon progression** rows use **`type`: `dungeon_run_progression_HERO_04`** (e.g. `dungeon_run_progression_HERO_04_0`), **`PLAYER_HERO` `HERO_04`**, **`DUNGEON_RUN_STEP`** + **`GAME_WON`**.

These **`type` values differ**. `AchievementsStateManagerService` builds completion steps by grouping all definitions that share the same `type`. A boss-victory completion therefore appears under the **boss victory series for that opponent**, not under the Paladin progression chain.

## Product implication

Unlocking `dungeon_run_boss_victory_LOOTA_BOSS_18h` is **not** expected to tick Paladin progression unless content changes so those achievements share a progression `type` or categories are reorganized.

## Related code fixes

- Unlock debug logs distinguish skip reasons (`alreadyCompleteInStorage`, `alreadyCompleteInDefinition`, `noDefinition`) from `processing unlock event`, and trace persist/publish/enqueue targets.
- `publishRemoteAchievement` updates `remoteAchievements$$` / disk cache without a logged-in user so grouped achievements UI can refresh offline; remote POST remains gated on user.
