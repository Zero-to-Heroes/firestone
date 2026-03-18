# Bug: Herald counter uses FullGameState (slow refresh)

## Problem

The HERALD counter reads from `fullGameState.PlayerEntity.tags.HERALD_COLOSSAL_AMOUNT`, but FullGameState refreshes infrequently. The counter should update in real-time when a player heralds.

## Solution (Implemented)

Emit `PLAYER_HERALDED` events from the C# parser when `TAG_CHANGE Entity=<PlayerName> tag=HERALD_COLOSSAL_AMOUNT` is seen in PowerTaskList logs. Store the count in `DeckState.heraldCountThisGame`. The herald counter prefers this event-based value for real-time updates and falls back to fullGameState for replays/rewinds.

## Changes

### hs-game-converter-csharp-port
- **HeraldColossalAmountParser.cs**: New parser that emits PLAYER_HERALDED when HERALD_COLOSSAL_AMOUNT changes on a player entity (PowerTaskList only)
- **NodeParser.cs**: Registered HeraldColossalAmountParser
- **HearthstoneReplays.csproj**: Added Compile for HeraldColossalAmountParser

### firestone
- **game-event.ts**: Added PLAYER_HERALDED constant
- **game-events.service.ts**: Added case to dispatch PLAYER_HERALDED
- **deck-state.ts**: Added heraldCountThisGame
- **herald-parser.ts**: New parser that updates heraldCountThisGame from PLAYER_HERALDED events
- **state-parsers.service.ts**: Registered HeraldParser
- **herald.ts**: Updated getHeraldAmount to prefer heraldCountThisGame with fullGameState fallback

## Branch

- firestone: `bug/herald`
- hs-game-converter-csharp-port: `bug/herald`

## Cleanup

After merge:
1. Compile hs-game-converter-csharp-port and put output DLL in firestone/overwolf-plugins
2. `git worktree remove .worktrees/bug-herald/firestone`
3. `git worktree remove .worktrees/bug-herald/hs-game-converter-csharp-port`
