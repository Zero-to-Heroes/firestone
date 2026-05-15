/**
 * Regression: Son of Hodir's Frost Tyrant token (TTN_083t) is summoned when drawn; it may briefly
 * appear as ZONE=HAND in the power log before CASTS_WHEN_DRAWN moves it to SETASIDE and summons a
 * board copy. The deck tracker must not leave that entity in hand after replay.
 *
 * Fixture: `test-tools/power.log` (trimmed game); path via {@link resolvePowerLogPathForSlug} slug
 * `frost-tyrant`.
 *
 * Run:
 *   export HS_REFERENCE_CARDS_JSON_PATH=https://raw.githubusercontent.com/Zero-to-Heroes/hs-reference-data/master/src/cards_short.json
 *   npx jest test-tools/bugs/frost-tyrant/power-log-frost-tyrant-replay.spec.ts --config=libs/game-state/jest.config.ts --runInBand
 */
import { CardIds } from '@firestone-hs/reference-data';
import {
	replayPowerLogToGameState,
	requirePowerLogFixtureExists,
	requirePowerLogReplayPrerequisites,
	requirePowerLogReplayResult,
	resolveCardsJsonPath,
	resolvePowerLogPathForSlug,
} from '../../lib/power-log-replay-harness';

const frostTyrantToken = CardIds.SonOfHodir_FrostTyrantToken;

describe('Power log replay → GameStateService (Frost Tyrant not in hand)', () => {
	it('does not keep Frost Tyrant token in either hand after cast-when-drawn resolution', async () => {
		const logPath = resolvePowerLogPathForSlug('frost-tyrant');
		const cardsPath = resolveCardsJsonPath();
		requirePowerLogFixtureExists(logPath);
		requirePowerLogReplayPrerequisites(cardsPath, logPath);

		const ctx = await replayPowerLogToGameState({
			logPath,
			reviewId: 'frost-tyrant-replay',
		});
		requirePowerLogReplayResult(ctx, cardsPath);

		const inHands = [...ctx.state.playerDeck.hand, ...ctx.state.opponentDeck.hand];
		const frostLeftInHand = inHands.filter((c) => c.cardId === frostTyrantToken);
		expect(frostLeftInHand).toEqual([]);
	}, 120_000);
});
