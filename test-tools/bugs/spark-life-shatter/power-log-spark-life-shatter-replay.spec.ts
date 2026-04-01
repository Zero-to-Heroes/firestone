/**
 * Regression: Spark of Life (EDR_872) shatters into two SHATTERED spells; the discover outcome
 * can be a Mage or Druid spell, so opponent-hand guesses must not be restricted to deck class only.
 *
 * Fixture: trimmed last game from support power.log (opponent Spark of Life → shatter).
 *
 * Run:
 *   npx jest test-tools/bugs/spark-life-shatter/power-log-spark-life-shatter-replay.spec.ts --config=libs/game-state/jest.config.ts --runInBand
 */
import { CardClass, CardIds, GameTag } from '@firestone-hs/reference-data';
import { DeckCard, hasCorrectClass } from '@firestone/game-state';
import {
	replayPowerLogToGameState,
	requirePowerLogReplayPrerequisites,
	requirePowerLogReplayResult,
	resolveCardsJsonPath,
	resolvePowerLogPathForSlug,
} from '../../lib/power-log-replay-harness';

describe('Power log replay → GameStateService (Spark of Life shatter pool)', () => {
	it('keeps SHATTERED possible cards as Mage ∪ Druid when Spark of Life is the resolved creator', async () => {
		const logPath = resolvePowerLogPathForSlug('spark-life-shatter');
		const cardsPath = resolveCardsJsonPath();
		requirePowerLogReplayPrerequisites(cardsPath, logPath);

		const ctx = await replayPowerLogToGameState({
			logPath,
			reviewId: 'spark-life-shatter-replay',
		});
		requirePowerLogReplayResult(ctx, cardsPath);

		const shatteredInHand = ctx.state.opponentDeck.hand.filter(
			(c) => c.tags?.[GameTag.SHATTERED] === 1 && !c.cardId,
		) as DeckCard[];

		expect(shatteredInHand.length).toBeGreaterThanOrEqual(2);
		const sparkId = CardIds.SparkOfLife_EDR_872;
		const missingCreator = shatteredInHand.filter((c) => c.creatorCardId !== sparkId);
		expect({
			entityIds: missingCreator.map((c) => c.entityId),
			creators: missingCreator.map((c) => c.creatorCardId),
		}).toEqual({ entityIds: [], creators: [] });

		const fromSpark = shatteredInHand.filter((c) => c.creatorCardId === sparkId);
		expect(fromSpark.length).toBe(shatteredInHand.length);

		const { allCardsRef } = ctx;
		for (const dc of fromSpark) {
			const pool = dc.guessedInfo?.possibleCards ?? [];
			expect(pool.length).toBeGreaterThan(0);
			const hasMage = pool.some((id) => hasCorrectClass(allCardsRef.getCard(id), CardClass.MAGE));
			const hasDruid = pool.some((id) => hasCorrectClass(allCardsRef.getCard(id), CardClass.DRUID));
			expect({ entityId: dc.entityId, hasMage, hasDruid, poolSize: pool.length }).toEqual(
				expect.objectContaining({ hasMage: true, hasDruid: true }),
			);
		}
	}, 120_000);
});
