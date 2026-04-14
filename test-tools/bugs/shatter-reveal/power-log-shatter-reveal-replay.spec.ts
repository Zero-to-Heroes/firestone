/**
 * Regression: Shadowed Informant discovers a spell that has Shatter; the two SHATTERED hand pieces
 * must still get a non-empty possibleCards pool (Shatter tokens), not lose the reveal entirely.
 *
 * Fixture: last game from support power.log (trimmed with the same CREATE_GAME rule as
 * trimPowerLogLinesToLastGame).
 *
 * Run:
 *   export HS_REFERENCE_CARDS_JSON_PATH=https://raw.githubusercontent.com/Zero-to-Heroes/hs-reference-data/master/src/cards_short.json
 *   npx jest test-tools/bugs/shatter-reveal/power-log-shatter-reveal-replay.spec.ts --config=libs/game-state/jest.config.ts --runInBand
 */
import { CardIds, GameTag } from '@firestone-hs/reference-data';
import { DeckCard } from '@firestone/game-state';
import {
	replayPowerLogToGameState,
	requirePowerLogReplayPrerequisites,
	requirePowerLogReplayResult,
	resolveCardsJsonPath,
	resolvePowerLogPathForSlug,
} from '../../lib/power-log-replay-harness';

describe('Power log replay → GameStateService (Shadowed Informant + Shatter)', () => {
	it('keeps SHATTERED opponent hand pieces with a non-empty possibleCards pool', async () => {
		const logPath = resolvePowerLogPathForSlug('shatter-reveal');
		const cardsPath = resolveCardsJsonPath();
		requirePowerLogReplayPrerequisites(cardsPath, logPath);

		const ctx = await replayPowerLogToGameState({
			logPath,
			reviewId: 'shatter-reveal-replay',
		});
		requirePowerLogReplayResult(ctx, cardsPath);

		const shatteredInHand = ctx.state.opponentDeck.hand.filter(
			(c) => c.tags?.[GameTag.SHATTERED] === 1 && !c.cardId,
		) as DeckCard[];

		expect(shatteredInHand.length).toBeGreaterThanOrEqual(2);

		const informantId = CardIds.ShadowedInformant_CATA_614;
		const withInformantCreator = shatteredInHand.filter((c) => c.creatorCardId === informantId);
		expect(withInformantCreator.length).toBe(shatteredInHand.length);

		for (const dc of withInformantCreator) {
			const pool = dc.guessedInfo?.possibleCards ?? [];
			expect(pool.length).toBeGreaterThan(0);
		}
	}, 120_000);
});
