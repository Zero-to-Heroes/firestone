/**
 * Regression: dual-class Arena (scenario 5505, see DUAL_CLASS_ARENA_SCENARIO_ID in game-state metadata): opponent draws a
 * Shatter spell from deck with no cardId in log; SHATTERED hand guesses use hero class plus hero
 * power class (e.g. Lunara + Fireblast → Druid ∪ Mage).
 *
 * Fixture: `test-tools/bugs/dual-class-shatter-draw/dual-class-shatter-draw.log` (same bytes as
 * `test-tools/power.log` at commit 0c0a39dc2, which introduced this spec; slug in power-log-replay-harness).
 *
 * Run:
 *   npx jest test-tools/bugs/dual-class-shatter-draw/power-log-dual-class-shatter-draw-replay.spec.ts --config=libs/game-state/jest.config.ts --runInBand
 */

describe('Power log replay → GameStateService (dual-class Arena shatter draw)', () => {
	it.todo(
		're-enable when dual-class-shatter-draw.log includes Shatter/SHATTERED opponent hand events (fixture is 5505 only today)',
	);

	// Fixture has scenario 5505 but no Shatter/SHATTERED lines in log — re-enable when a matching capture exists.
	// import { CardClass, GameTag } from '@firestone-hs/reference-data';
	// import { DeckCard, hasCorrectClass } from '@firestone/game-state';
	// import {
	// 	replayPowerLogToGameState,
	// 	requirePowerLogReplayPrerequisites,
	// 	requirePowerLogReplayResult,
	// 	resolveCardsJsonPath,
	// 	resolvePowerLogPathForSlug,
	// } from '../../lib/power-log-replay-harness';
	/* it('keeps SHATTERED possible cards as Mage ∪ Druid from dual-class Arena hero + hero power', async () => {
		const logPath = resolvePowerLogPathForSlug('dual-class-shatter-draw');
		const cardsPath = resolveCardsJsonPath();
		requirePowerLogReplayPrerequisites(cardsPath, logPath);

		const ctx = await replayPowerLogToGameState({
			logPath,
			reviewId: 'dual-class-shatter-draw-replay',
		});
		requirePowerLogReplayResult(ctx, cardsPath);

		const shatteredInHand = ctx.state.opponentDeck.hand.filter(
			(c) => c.tags?.[GameTag.SHATTERED] === 1 && !c.cardId,
		) as DeckCard[];

		expect(shatteredInHand.length).toBeGreaterThanOrEqual(2);

		const { allCardsRef } = ctx;
		for (const dc of shatteredInHand) {
			const pool = dc.guessedInfo?.possibleCards ?? [];
			expect(pool.length).toBeGreaterThan(0);
			const hasMage = pool.some((id) => hasCorrectClass(allCardsRef.getCard(id), CardClass.MAGE));
			const hasDruid = pool.some((id) => hasCorrectClass(allCardsRef.getCard(id), CardClass.DRUID));
			expect({ entityId: dc.entityId, hasMage, hasDruid, poolSize: pool.length }).toEqual(
				expect.objectContaining({ hasMage: true, hasDruid: true }),
			);
		}
	}, 120_000); */
});
