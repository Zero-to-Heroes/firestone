/**
 * End-state regression for the `amalgam-atk` bug. Sister to
 * `replay-parser-entity-152-invariant.spec.ts`:
 *
 *   - the invariant spec pins the parser-internal mechanism (PTL must contain entity 152
 *     when the failing `TAG_CHANGE` line is read);
 *   - this spec pins the user-observable consequence: after the full power.log is replayed,
 *     the deck tracker must have processed PTL `TAG_CHANGE GameEntity tag=TURN value=15`
 *     (which `TurnStartParser` exclusively triggers off the PowerTaskList stream).
 *
 * ### Why `currentTurnNumeric >= 8`?
 *
 * `NewTurnParser` collapses the raw game-side TURN tag to a per-player turn count via
 * `Math.ceil(gameTurnNumber / 2)`. The fixture's last PTL `tag=TURN value=15` therefore
 * promotes `state.currentTurn` from 7 (`ceil(14/2)`) to 8 (`ceil(15/2)`).
 *
 * On the BUGGY parser, the throw on PTL `TAG_CHANGE id=152 tag=ATK` at fixture-line ~18598
 * (20:58:07) aborts the rest of that `ProcessingQueue` batch, dropping the turn-15
 * `TAG_CHANGE GameEntity tag=TURN value=15` line on the floor - `currentTurnNumeric` stays
 * stuck at 7. A correct parser drives it to 8.
 *
 * The 8-vs-7 gap is small but it is the cleanest user-observable end-state signal: it
 * fails RED iff the failing TAG_CHANGE aborts the batch, and passes GREEN iff the full
 * fixture is replayed. Asserting on entity 152 directly is what the diagnostic spec does.
 *
 * ### Why not assert "does not throw" directly?
 *
 * The throw is the symptom, not the contract. Per user constraint we explicitly do NOT add
 * a null guard inside `MinionOnBoardAttackUpdatedParser` - that would silence the symptom
 * without fixing the underlying snapshot/restore desync. Any future fix that *does* hide
 * the throw without driving the end-state turn forward is not a real fix; this spec is
 * what catches that case.
 *
 * ### Queue idle timeout
 *
 * With the bug, the `ProcessingQueue` retries the crashing batch forever (the catch never
 * removes the failing line, the next interval tick runs the same batch, throws again, ...).
 * We pass a short `processingQueueIdleTimeoutMs` so the harness doesn't sit on its default
 * 10-minute wait. The bug is observable on `state` regardless of whether the queue ever
 * drains.
 */
import {
	replayPowerLogToGameState,
	requirePowerLogReplayPrerequisites,
	requirePowerLogReplayResult,
	resolveCardsJsonPath,
	resolvePowerLogPathForSlug,
} from '../../lib/power-log-replay-harness';

describe('Power log replay → GameStateService (amalgam-atk turn advance)', () => {
	it(
		'reaches turn 8 (PTL TURN=15) after replaying the full fixture',
		async () => {
			const logPath = resolvePowerLogPathForSlug('amalgam-atk');
			const cardsPath = resolveCardsJsonPath();
			requirePowerLogReplayPrerequisites(cardsPath, logPath);

			const ctx = await replayPowerLogToGameState({
				logPath,
				reviewId: 'amalgam-atk-power-log-replay',
				// On a buggy parser the ProcessingQueue would retry forever (infinite retry on
				// the crashing batch). 30s is enough for many retry cycles on the RED side. On
				// GREEN the queue drains naturally well before this.
				processingQueueIdleTimeoutMs: 30_000,
			});
			requirePowerLogReplayResult(ctx, cardsPath);
			try {
				// PTL TAG_CHANGE GameEntity tag=TURN value=15 is at fixture-line ~18653, AFTER
				// the failing PTL TAG_CHANGE id=152 tag=ATK at line ~18598. TurnStartParser
				// only fires on the PTL stream, so on the buggy run the consumer-level
				// `currentTurnNumeric` stays stuck at 7 (`ceil(14/2)`). A correct parser
				// processes TURN=15 and advances it to 8 (`ceil(15/2)`). See the file-level
				// JSDoc for the full math.
				expect(ctx.state.currentTurnNumeric).toBeGreaterThanOrEqual(8);
			} finally {
				// Tear down the lingering ProcessingQueue interval so Jest can exit cleanly
				// even when the parser throw causes the queue to retry forever (the catch
				// branch is hit on RED; on GREEN the queue drains naturally and cleanup is a
				// no-op).
				ctx.cleanup();
			}
		},
		120_000,
	);
});
