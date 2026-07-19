/**
 * Regression: rewind handling must not leave the opponent's hand over-counted.
 *
 * Reporter: "There are 11 cards in the opponent's hand" while replaying the attached log.
 * Since `MAXHANDSIZE=10` is the in-engine cap, any tracker view ending with 11 entries in
 * `state.opponentDeck.hand` is unambiguously a tracker bug (game rules can never produce that).
 *
 * Fixture: single-game power.log, Mage (Jaina, P1) vs Druid (Chmielinho, P2). On turn 8 the
 * player plays Sands of Time (`TIME_EVENT_999`); the discovered token `TIME_000tb` carries the
 * `REWIND` mechanic and triggers a `BlockType=GAME_RESET` on entity id=18. Inside the
 * PowerTaskList `GAME_RESET` block, the authoritative `FULL_ENTITY` dump shows the opponent
 * with exactly 6 cards in `ZONE=HAND` (entities 38, 41, 43, 47, 58, 139) — that is the
 * ground truth right after the rewind. The post-rewind game then continues to the end of the
 * log; the tracker invariant `opponentDeck.hand.length <= MAXHANDSIZE` must still hold.
 *
 * Run:
 *   export HS_REFERENCE_CARDS_JSON_PATH=https://raw.githubusercontent.com/Zero-to-Heroes/hs-reference-data/master/src/cards_short.json
 *   npx jest test-tools/bugs/rewind-opp-hand/power-log-rewind-opp-hand-replay.spec.ts --config=libs/game-state/jest.config.ts --runInBand
 */
import {
	replayPowerLogToGameState,
	requirePowerLogReplayPrerequisites,
	requirePowerLogReplayResult,
	resolveCardsJsonPath,
	resolvePowerLogPathForSlug,
} from '../../lib/power-log-replay-harness';

describe('Power log replay → GameStateService (rewind / opponent hand size)', () => {
	it(
		'reporter log: opponent hand stays at or below MAXHANDSIZE after Sands of Time rewind',
		async () => {
			const logPath = resolvePowerLogPathForSlug('rewind-opp-hand');
			const cardsPath = resolveCardsJsonPath();
			requirePowerLogReplayPrerequisites(cardsPath, logPath);

			const ctx = await replayPowerLogToGameState({
				logPath,
				reviewId: 'rewind-opp-hand-replay',
			});
			requirePowerLogReplayResult(ctx, cardsPath);

			const handSize = ctx.state.opponentDeck.hand.length;
			// Primary invariant the reporter saw violated: the in-engine `MAXHANDSIZE` cap
			// of 10 must hold at end of replay. Pre-fix the harness reported 11 here, so the
			// bound is strictly observable, not symbolic.
			expect(handSize).toBeLessThanOrEqual(10);
		},
		300_000,
	);
});
