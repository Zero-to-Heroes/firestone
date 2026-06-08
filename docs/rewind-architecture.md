# Rewind (Mister Clocksworth / Sands of Time) — architecture & decisions

This file is the **single source of truth** for how rewinds (`BlockType=GAME_RESET`,
triggered by cards with the `REWIND` mechanic) are handled, and for the design decisions we
have already settled. Read this before touching rewind code so we don't re-litigate the same
debates.

## Hard rules (settled decisions — do NOT reopen without a new explicit discussion)

1. **No reconciliation from the `RESET_GAME` block.** We do not patch state after a rewind by
   reading the authoritative `FULL_ENTITY` dump inside the `GAME_RESET` block and diffing it
   against our state. If we find ourselves "fixing up" or "re-applying" state after a restore
   (special handlers, death-replay buffers, board reconciliation, etc.), we are approaching the
   problem the wrong way.
2. **Each stream owns its own snapshot.** The parser keeps a fully independent snapshot pipeline
   per log stream — `GS` (`GameState.DebugPrintPower`) and `PTL` (`PowerTaskList.DebugPrintPower`).
   Each half is captured at the moment *its own* stream reaches the rewound action's `BLOCK_START`,
   and restored when *its own* stream reaches the `GAME_RESET`. The two halves are never cloned at
   the same wall-clock moment (see `rewind-controller.ts`).
3. **The consumer snapshot/restore is driven by the PTL stream only.** Practically all
   consumer state that a rewind must roll back — the deck-tracker zones (`board`, `hand`,
   `deck`, `otherZone`), `secrets`, hero / mana / `cardsLeftInDeck` — is built from PTL-stream
   events. So the consumer takes its single `GameState` snapshot at the **PTL** action-start and
   restores it at the **PTL** `GAME_RESET`. The GS stream's rewind events are intentionally
   **not** wired to the consumer snapshot/restore. See "Why PTL-only (and not GS, overlay, or
   per-field)" below.

## Why a single (GS-timed) consumer snapshot is wrong

The offline replay (and the live pipeline) flush the parser's two queues independently: within a
batch, `GSState.NodeParser.ClearQueue()` runs **before** `PTLState.NodeParser.ClearQueue()`. Each
queue is sorted by timestamp internally, but the GS queue is fully drained before the PTL queue.

Consequence: a PTL event with an *earlier* timestamp than a GS event is still delivered to the
consumer *after* that GS event whenever they fall in the same batch.

The deck-tracker zones are entirely PTL-driven:

| Consumer state                              | Source stream | Parser emitter                                   |
| ------------------------------------------- | ------------- | ------------------------------------------------ |
| board adds (`CARD_PLAYED`, `MINION_SUMMONED`) | **PTL**       | `card-played-from-hand-parser`, `minion-summoned-parser` |
| board removals (`MINIONS_DIED`, `ZONE_CHANGE`, `CARD_REMOVED_FROM_BOARD`, `MINION_BACK_ON_BOARD`) | **PTL** | `minion-died-parser`, `zone-change-parser`, … |
| hand (`RECEIVE_CARD_IN_HAND`, `CARD_DRAW_FROM_DECK`) | **PTL**       | respective PTL parsers                           |
| `hero` / mana / `cardsLeftInDeck`           | PTL           | `applyPtlGameStateUpdate` → `updateDeckFromParserState` |
| `MINIONS_WILL_DIE`                          | GS            | `minions-will-die-parser`                        |
| discovers / `ENTITY_CHOSEN`                 | GS            | `entity-chosen-parser`                           |

Originally the consumer's rewind snapshot was captured on `REWIND_CAPABLE_ACTION_START` and
restored on `REWIND_STARTED`, **both emitted on the GS queue only**. The PTL-side capture
(`captureFor('PTL')`) and PTL-side restore (`onPtlGameResetStart`) were silent toward the consumer.

So the consumer snapshot was taken at GS-capture time, before the same batch's PTL events were
flushed. Any PTL board mutation whose timestamp precedes the rewound action but whose event is
delivered after the GS capture was missing from the snapshot, and restoring it rolled the board
back to before that mutation.

### Concrete reproduction (`clocksworth-rewind`)

Opponent has Vanessa the Ringleader (id=42) and Demolition Renovator (id=52) on board. During the
local player's turn, Fyrakk generates Decimation (`CATA_581`, entity 245); its board clear kills
42/52 at 11:30:19 (PTL `MINIONS_DIED`). The opponent then triggers Mister Clocksworth (`TIME_038`,
id=236), whose Rewind fires a `GAME_RESET` at 11:30:48.

Observed consumer event order:

```
[capture]      origin=236 capturedAt=11:30:35  oppBoard=[209,42,52]   <- GS-timed snapshot (pre-death)
MINIONS_DIED   ts=11:30:19 dead=[9,42,52]       oppBoard=[209,42,52]   <- PTL death, applied AFTER capture
REWIND_STARTED ts=11:30:48                       oppBoard=[209,236,256] <- live board already correct
[restore]      origin=236 capturedAt=11:30:35    oppBoard=[209,42,52]   <- stale snapshot resurrects 42/52
```

The death's timestamp (11:30:19) is < the snapshot's `capturedAt` (11:30:35), i.e. it is real
pre-action history, not a rewound-branch event — so the `[lowerBound, cutoff)` drop filter
correctly leaves it alone, and it never re-fires after the restore. Result: 42/52 are resurrected,
and the second back-to-back Clocksworth rewind then snapshots the already-resurrected board.

Regression test: `test-tools/bugs/clocksworth-rewind/power-log-clocksworth-rewind-replay.spec.ts`.

## The fix (implemented): move the consumer snapshot/restore to the PTL stream

The consumer keeps a **single** `GameState` snapshot per rewind (keyed by `originEntityId`), but
the three consumer-facing rewind events are now emitted on the **PTL** queue instead of the GS
queue. The consumer code is unchanged — only the stream they ride on changed:

- **`REWIND_CAPABLE_ACTION_START`** (snapshot push): emitted from the PTL-side capture hook
  `RewindControllerHooks.onRewindCapablePtlActionStart` (fired in `RewindController.captureFor('PTL')`),
  enqueued on the PTL queue at `meta.capturedAt` = the PTL action-start timestamp. By then every
  PTL board mutation that *precedes* the rewound action (e.g. the Decimation board clear that kills
  42/52) is already applied, so the snapshot is correct.
- **`REWIND_STARTED`** (snapshot restore): emitted from the PTL branch of
  `handleGameResetBlockStart` (when `onPtlGameResetStart` restores the PTL parser half), on the PTL
  queue.
- **`REWIND_OVER`** (deckstring rollback bracket close): emitted from the PTL branch of
  `handleBlockEndForGameReset`, on the PTL queue.

The GS branches still do their parser-internal work (`onGsGameResetStart`, `insideGameResetGS`,
`pendingPtlRewindFlush` to drop the PTL rewound-action tail) — they just no longer emit the
consumer snapshot/restore events. The GS-side capture hook `onRewindCapableActionStart` is retained
purely for instrumentation/tests.

### Why PTL-only (and not GS, overlay, or per-field)

- **GS-only** (the original) snapshots a board that is missing same-batch PTL mutations → resurrects
  dead minions (the clocksworth bug, and it also wrongly *removed* legitimately-summoned minions in
  other logs — e.g. Helpless Hatchling in `rewind_opp_amalgam_atk`).
- **Overlay** (GS restores everything, PTL re-overlays its zones) means the GS `GAME_RESET` fires
  while PTL events for the same action are still in flight, leaving an intermediate state that other
  events can read/mutate. Rejected as fragile/corruptible.
- **Per-field ownership** (split GS-owned vs PTL-owned fields on the merged `GameState`/`DeckState`
  and restore each on its own stream) is correct in principle but the fields don't partition
  cleanly — `discoversThisGame`, `secrets`, and the deck zones all live on the same `DeckState`
  object — so it's complex and error-prone.
- **PTL-only** is simple (no consumer change), and correct for everything that matters: board, hand,
  deck, `otherZone`, `secrets`, hero/mana are all PTL-driven.

### Accepted trade-off

GS-only consumer state (`discoversThisGame` / `ENTITY_CHOSEN` / `currentOptions`) is rolled back at
**PTL** `GAME_RESET` timing rather than GS timing. The only observable difference is for a discover
/ choice that happens strictly between the GS `GAME_RESET` and the PTL `GAME_RESET` of the same
rewind — a narrow window. This shows up in the non-reg corpus as empty `currentOptions` on
`rewind_opp_first` / `rewind_opp_second` and is considered acceptable.

### Verification

- Target regression: `test-tools/bugs/clocksworth-rewind/power-log-clocksworth-rewind-replay.spec.ts`
  (red before, green after).
- All dedicated rewind correctness specs pass: `amalgam-atk` (incl. entity-152 invariant),
  `wrong-secrets`, `rewind-opp-hand`, `rewind-token-in-hand`, `sands-time-shatter`,
  `smoldering-grove`, `coin-in-opp-deck`.
- `test-tools/non-reg/rewind-nonreg.spec.ts` goldens were **regenerated**: the old goldens had
  baked in the GS-timed board bug (e.g. the missing Helpless Hatchling). The regenerated goldens
  reflect the corrected board state plus the accepted `currentOptions` trade-off above.
