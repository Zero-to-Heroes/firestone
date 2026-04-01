/**
 * Regression: Soldier of Onyxia (CATA_780t) dynamic related-card pool must use stored minion cost (2),
 * not default to 1 when TAG_SCRIPT_DATA_NUM_1 is absent from parser entities.
 *
 * Fixture: `soldier-onyxia.log`. Expected stored cost is 2 per {@link CardIds.ObsessiveTechnician_SoldierOfOnyxiaToken_CATA_780t}
 * reference tags (and card text).
 *
 * Run:
 *   npx jest test-tools/bugs/soldier-onyxia/power-log-soldier-onyxia-replay.spec.ts --config=libs/game-state/jest.config.ts --runInBand
 */
import * as fs from 'fs';
import { CardClass, CardIds } from '@firestone-hs/reference-data';
import { getDynamicRelatedCardIds, hasOverride } from '@firestone/game-state';
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

const SOLDIER_CARD_ID = CardIds.ObsessiveTechnician_SoldierOfOnyxiaToken_CATA_780t;
/** Stored random minion cost (not the Soldier's own mana cost). */
const STORED_MINION_COST = 2;

describe('Power log replay → GameStateService (Soldier of Onyxia pool cost)', () => {
	it('fixture log contains summoned Soldier of Onyxia (CATA_780t)', () => {
		const logPath = resolvePowerLogPathForSlug('soldier-onyxia');
		requirePowerLogFixtureExists(logPath);
		const raw = fs.readFileSync(logPath, 'utf8');
		const lines = trimPowerLogLinesToLastGame(raw.split(/\r?\n/));
		const hasSoldier = lines.some((l) => l.includes('CATA_780t') && l.includes('Soldier of Onyxia'));
		expect(hasSoldier).toBe(true);
	});

	it(
		'replays soldier-onyxia.log; dynamic pool for Soldier is 2-cost minions only',
		async () => {
			const logPath = resolvePowerLogPathForSlug('soldier-onyxia');
			const cardsPath = resolveCardsJsonPath();
			requirePowerLogReplayPrerequisites(cardsPath, logPath);
			const ctx = await replayPowerLogToGameState({
				logPath,
				reviewId: 'soldier-onyxia-power-log-replay',
			});
			requirePowerLogReplayResult(ctx, cardsPath);

			const soldiers = collectAllDeckCards(ctx.state).filter((c) => c.cardId === SOLDIER_CARD_ID);
			expect(soldiers.length).toBeGreaterThan(0);
			const soldier = soldiers.find((c) => c.zone === 'PLAY') ?? soldiers[soldiers.length - 1]!;

			const ownerDeck =
				ctx.state.playerDeck.board.some((c) => c.entityId === soldier.entityId) ||
				ctx.state.playerDeck.hand.some((c) => c.entityId === soldier.entityId)
					? ctx.state.playerDeck
					: ctx.state.opponentDeck;

			const heroClass: CardClass | undefined = ownerDeck.hero?.classes?.[0];
			const currentClass = heroClass ? CardClass[heroClass] : '';

			const rawPool = getDynamicRelatedCardIds(SOLDIER_CARD_ID, soldier.entityId, ctx.allCardsRef, {
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
			const wrongCost = pool.filter(
				(id) => (ctx.allCardsRef.getCard(id)?.cost ?? -1) !== STORED_MINION_COST,
			);
			expect(wrongCost).toEqual([]);
		},
		120_000,
	);
});
