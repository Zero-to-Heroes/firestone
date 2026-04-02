/**
 * Regression: attack overlay (totalAttackOnBoard) must not read 0 when the local player has a
 * lethal board (support report: "attack counter showed 0 last turn").
 *
 * Fixture: last game from support `power.log` (trimmed with `trimPowerLogLinesToLastGame`), then
 * truncated to **23539 lines** — the last line is immediately before the next `FULL_ENTITY` block
 * in the Onyxia / Al'Akir lethal turn (`acz-last-game.log` line 23540). At this snapshot the old
 * summoning-sickness formula yields **0** total attack; the fixed parser counts Rush / Colossal limbs.
 * To verify red/green: temporarily restore the pre-fix `hasSummoningSicknessForAttackOnBoard` in
 * `attack-on-board-summoning.ts` (`exhausted || ATTACKABLE_BY_RUSH`, no Rush/Colossal exclusion)
 * and this test should fail with `Received: 0`.
 *
 * Run:
 *   export HS_REFERENCE_CARDS_JSON_PATH=https://raw.githubusercontent.com/Zero-to-Heroes/hs-reference-data/master/src/cards_short.json
 *   npx jest test-tools/bugs/attack-counter-zero/power-log-attack-counter-zero-replay.spec.ts --config=libs/game-state/jest.config.ts --runInBand
 */
import {
	replayPowerLogToGameState,
	requirePowerLogFixtureExists,
	requirePowerLogReplayPrerequisites,
	requirePowerLogReplayResult,
	resolveCardsJsonPath,
	resolvePowerLogPathForSlug,
} from '../../lib/power-log-replay-harness';

describe('Power log replay → GameStateService (attack counter)', () => {
	it('player totalAttackOnBoard is non-zero at lethal-board snapshot (support power.log)', async () => {
		const logPath = resolvePowerLogPathForSlug('attack-counter-zero');
		const cardsPath = resolveCardsJsonPath();
		requirePowerLogFixtureExists(logPath);
		requirePowerLogReplayPrerequisites(cardsPath, logPath);

		const ctx = await replayPowerLogToGameState({
			logPath,
			reviewId: 'attack-counter-zero-replay',
		});
		requirePowerLogReplayResult(ctx, cardsPath);

		const ta = ctx.state.playerDeck.totalAttackOnBoard;
		const sum = (ta?.board ?? 0) + (ta?.hero ?? 0);
		expect(sum).toBeGreaterThan(0);
	}, 120_000);
});
