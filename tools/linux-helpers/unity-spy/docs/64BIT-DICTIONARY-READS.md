# 64-bit generic value-type reads & `Dictionary<int,int>` regression

This documents a memory-reading bug that appeared after Hearthstone became a
64-bit process, the fix, and the live non-regression tests that guard it.

## Symptom

Mousing over a hero portrait in the Battlegrounds leaderboard returned a wrong
`PLAYER_ID` (e.g. `45` or `1373`) instead of a value in the 1-8 range. The same
corruption affected **every** `Dictionary<int,int>` in the game, because entity
tags are stored in `Entity.m_tags.m_values`, a `Dictionary<int,int>`.

## Root cause

Mono stores struct field offsets against the **open generic definition**
`Dictionary<TKey,TValue>+Entry`, where the generic-parameter (`VAR`) fields each
take a full pointer-sized (8-byte) slot. The reported offsets (including the
16-byte object header) are therefore:

```
hashCode@16   next@20   key@24   value@32
```

But the **instantiated** `Dictionary<int,int>+Entry` packs to a 16-byte struct:

```
data offset:  0          4        8       12
field:        hashCode   next     key     value      (4 bytes each, stride = 16)
```

The array element stride was already correct (16). Reading `value` at the
open-generic data offset 16 (`= 32 - 16` header) therefore lands on the **next
entry's first 4 bytes = its `hashCode`**. Since mono stores `hashCode == key` for
`int` keys, every `value[i]` came back as `key[i+1]` — the tell-tale "chain". A
portrait hover read a neighbouring tag (HEALTH=45, PLAYER_LEADERBOARD_PLACE=1373)
instead of PLAYER_ID (tag 30).

This was the inverse of commit `5517319`, which removed the offset correction to
fix `Dictionary<int, QuestModel>` — a *reference*-valued dict where `value` is an
8-byte pointer, legitimately 8-aligned at data offset **16**. Removing the
correction fixed reference values but broke `int` values.

## The fix

`UnitySpy/Detail/FieldDefinition.cs` — `GetValue` now calls
`TryGetInflatedValueTypeOffset`, which recomputes a value-type struct's field
offsets from the **real instantiated layout**: it walks the fields in offset
order and re-packs each one using its actual inflated size/alignment (`VAR` fields
resolved against the concrete type arguments via `GetInflatedFieldSize`).

| Dictionary                      | value field offset | notes                         |
| ------------------------------- | ------------------ | ----------------------------- |
| `Dictionary<int,int>`           | 12                 | int packed after the int key  |
| `Dictionary<int, QuestModel>`   | 16                 | pointer, 8-aligned (pad@12)   |

It only triggers for value-type structs containing generic `VAR` fields, and
falls back to the legacy offset whenever a field's inflated size can't be
determined safely (inline value-type/enum/native-int fields), so non-generic
structs and reference paths are unaffected.

Supporting (non-essential) changes in `UnitySpy.HearthstoneLib`:
`InputManagerReader.ReadCurrentMousedOverBgLeaderboardTile` reads the hero from
`m_playerHeroEntity` (falling back to `m_entity`), and `CardMouseOverNotifier`
prefers the dedicated leaderboard reader for GAMEPLAY mouseovers.

## Non-regression tests

`UnitySpy.HearthstoneLibTests/DictionaryReadRegressionTests.cs` (all tagged
`[TestCategory("Regression")]`):

| Test                                          | Verifies                                                                                                | Prerequisite                          |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| `DictionaryIntInt_ValueIsReadFromCorrectOffset` | Per entry, UnitySpy's `value` matches the raw bytes at packed offset **12** (not 16), and the `value[i]==key[i+1]` chain is gone. | In any game/match                     |
| `DictionaryIntReference_ValuesReadCorrectly`  | Reference-valued dict (`Dictionary<int, QuestModel>` via `GetQuests`) still reads valid ids/progress — guards the offset-16 branch. | Logged in (quests available)          |
| `BattlegroundsLeaderboardHover_ReturnsValidPlayerId` | The moused-over BG leaderboard hero's `PLAYER_ID` is in 1-8.                                       | Hovering a BG leaderboard portrait    |

All three read a **live** 64-bit Hearthstone process and self-mark
`Inconclusive` (reported as **Skipped**) when their prerequisite isn't met
(game not running, not in a match, or no tile under the cursor) — so they never
produce false failures in CI/menu state.

## How to run

The game must be running.

1. Build the test project:

```bash
cd <repo>/forks/unityspy-2
dotnet build UnitySpy.HearthstoneLibTests/UnitySpy.HearthstoneLibTests.csproj
```

2. Run with `vstest.console.exe` against the freshly built DLL. `/Platform:x64`
   is required because the process being read is 64-bit:

```bash
"/c/Program Files/Microsoft Visual Studio/2022/Community/Common7/IDE/Extensions/TestPlatform/vstest.console.exe" \
    "UnitySpy.HearthstoneLibTests/bin/Debug/UnitySpy.HearthstoneLibTests.dll" \
    /Tests:DictionaryIntInt_ValueIsReadFromCorrectOffset,DictionaryIntReference_ValuesReadCorrectly,BattlegroundsLeaderboardHover_ReturnsValidPlayerId \
    /Platform:x64
```

To exercise the most coverage in one go: be **in a Battlegrounds match** and
**hover a leaderboard portrait** while running — that satisfies all three
prerequisites at once.

### Gotchas learned

- Point vstest at `bin/Debug/...dll` directly; a stale DLL elsewhere makes it
  report "no test matches the specified selection criteria".
- `/Platform:x64` is mandatory (the game is 64-bit).
- The running **app** uses its own deployed `UnitySpy.dll`; rebuilding the source
  here does not update the app until that DLL is redeployed. The tests above run
  the freshly-built code directly, so they reflect the fix immediately.
- `DebugScanTests.cs` holds ad-hoc live memory dumpers useful when investigating
  future offset issues. A throwaway `DebugTagMap` dumper (raw uint32 sequence vs.
  UnitySpy-decoded entries) is what pinned down this bug — recreate something
  similar if a struct layout looks wrong again after a Unity/Mono update.
