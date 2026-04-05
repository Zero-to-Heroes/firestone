/**
 * Regression: Deck cards created by Enthrall (CATA_190t13) must expose the legendary Dragon minion pool
 * in getDynamicRelatedCardIds (deck tracker “related cards” tooltip), using the creator’s dynamicPool.
 *
 * Fixture: `enthrall-pool.log` — trimmed after Deathwing Cataclysm Enthrall shuffle (see bug report).
 *
 * Run:
 *   export HS_REFERENCE_CARDS_JSON_PATH=https://raw.githubusercontent.com/Zero-to-Heroes/hs-reference-data/master/src/cards_short.json
 *   npx jest test-tools/bugs/enthrall-pool/power-log-enthrall-pool-replay.spec.ts --config=libs/game-state/jest.config.ts --runInBand
 */
import * as fs from 'fs';
import { CardClass, CardIds, CardRarity, CardType, hasCorrectTribe, Race } from '@firestone-hs/reference-data';
import {
	getDynamicRelatedCardIds,
	hasCorrectRarity,
	hasCorrectType,
	hasOverride,
} from '@firestone/game-state';
import { trimPowerLogLinesToLastGame } from '../../lib/trim-power-log-last-game';
import {
	collectAllDeckCards,
	replayPowerLogToGameState,
	requirePowerLogFixtureExists,
	requirePowerLogReplayPrerequisites,
	requirePowerLogReplayResult,
	resolveCardsJsonPath,
	resolvePowerLogPathForSlug,
} from '../../lib/power-log-replay-harness';

const ENTHRALL_CREATOR = CardIds.EnthrallToken_CATA_190t13;

describe('Power log replay → Enthrall deck pool (dynamic related cards)', () => {
	it('fixture log references Enthrall token (CATA_190t13)', () => {
		const logPath = resolvePowerLogPathForSlug('enthrall-pool');
		requirePowerLogFixtureExists(logPath);
		const raw = fs.readFileSync(logPath, 'utf8');
		const lines = trimPowerLogLinesToLastGame(raw.split(/\r?\n/));
		const hasEnthrall = lines.some((l) => l.includes('CATA_190t13') && l.includes('Enthrall'));
		expect(hasEnthrall).toBe(true);
	});

	it(
		'replays enthrall-pool.log; dynamic pool for cards created by Enthrall is legendary Dragon minions',
		async () => {
			const logPath = resolvePowerLogPathForSlug('enthrall-pool');
			const cardsPath = resolveCardsJsonPath();
			requirePowerLogReplayPrerequisites(cardsPath, logPath);
			const ctx = await replayPowerLogToGameState({
				logPath,
				reviewId: 'enthrall-pool-power-log-replay',
				settleMs: 90_000,
			});
			requirePowerLogReplayResult(ctx, cardsPath);

			const withCreator = collectAllDeckCards(ctx.state).filter((c) => c.creatorCardId === ENTHRALL_CREATOR);
			expect(withCreator.length).toBeGreaterThan(0);

			const sample = withCreator.find((c) => c.entityId != null) ?? withCreator[0]!;
			const cardIdForLookup = sample.cardId ?? '';
			const ownerDeck =
				ctx.state.playerDeck.deck.some((c) => c.entityId === sample.entityId) ||
				ctx.state.playerDeck.hand.some((c) => c.entityId === sample.entityId)
					? ctx.state.playerDeck
					: ctx.state.opponentDeck;

			const heroClass: CardClass | undefined = ownerDeck.hero?.classes?.[0];
			const currentClass = heroClass ? CardClass[heroClass] : '';

			const rawPool = getDynamicRelatedCardIds(cardIdForLookup, sample.entityId!, ctx.allCardsRef, {
				format: ctx.state.metadata.formatType,
				gameType: ctx.state.metadata.gameType,
				scenarioId: ctx.state.metadata.scenarioId,
				currentClass,
				deckState: ownerDeck,
				opponentDeckState: ownerDeck === ctx.state.playerDeck ? ctx.state.opponentDeck : ctx.state.playerDeck,
				gameState: ctx.state,
				validArenaPool: [],
			});
			const pool: readonly string[] = hasOverride(rawPool) ? rawPool.cards : rawPool;

			expect(pool.length).toBeGreaterThan(0);
			const bad = pool.filter((id) => {
				const ref = ctx.allCardsRef.getCard(id);
				return (
					!ref ||
					!hasCorrectType(ref, CardType.MINION) ||
					!hasCorrectRarity(ref, CardRarity.LEGENDARY) ||
					!hasCorrectTribe(ref, Race.DRAGON)
				);
			});
			expect(bad).toEqual([]);
		},
		180_000,
	);
});
