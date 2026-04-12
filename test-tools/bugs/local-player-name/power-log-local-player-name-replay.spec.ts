/**
 * Regression: LOCAL_PLAYER must carry the battletag from DebugPrintGame once all PlayerName lines
 * are present (empty-string Name before the second line must not assign early).
 *
 * Fixture: `local-player-name.log` in this folder (see `DEFAULT_BUG_LOG_BY_SLUG` in power-log-replay-harness).
 *
 * Run:
 *   HS_REFERENCE_CARDS_JSON_PATH=https://raw.githubusercontent.com/Zero-to-Heroes/hs-reference-data/master/src/cards_short.json \
 *   npx jest test-tools/bugs/local-player-name/power-log-local-player-name-replay.spec.ts --config=libs/game-state/jest.config.ts --runInBand
 */
import {
	requirePowerLogFixtureExists,
	requirePowerLogReplayPrerequisites,
	requirePowerLogReplayResult,
	resolveCardsJsonPath,
	resolvePowerLogPathForSlug,
	replayPowerLogToGameState,
} from '../../lib/power-log-replay-harness';

describe('Power log replay → GameStateService (LOCAL_PLAYER name)', () => {
	it(
		'replays local-player-name.log and sets playerDeck.hero.playerName from battletag',
		async () => {
			const logPath = resolvePowerLogPathForSlug('local-player-name');
			const cardsPath = resolveCardsJsonPath();
			requirePowerLogReplayPrerequisites(cardsPath, logPath);
			const ctx = await replayPowerLogToGameState({
				logPath,
				reviewId: 'local-player-name-replay',
			});
			requirePowerLogReplayResult(ctx, cardsPath);

			const name = ctx.state.playerDeck.hero.playerName;
			expect(name).toBeTruthy();
			// Log: PlayerID=2, PlayerName=Matthieu#2861 — LocalPlayerParser uses the part before #.
			expect(name).toBe('Matthieu');
		},
		120_000,
	);
});
