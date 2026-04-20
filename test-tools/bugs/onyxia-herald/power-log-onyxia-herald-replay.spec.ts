/**
 * Regression: Onyxia's Wing (CATA_155t / CATA_155t1) dynamic pool must use Herald-upgraded random minion
 * cost from TAG_SCRIPT_DATA_NUM_1, not a parser-only value that the power log later overwrites to 2.
 *
 * Fixture: `onyxia-herald.log` (trimmed last game from support zip). For entity 177 (Onyxia's Wing
 * CATA_155t), SHOW_ENTITY includes `tag=TAG_SCRIPT_DATA_NUM_1 value=4` (~line 21421); the same block
 * then applies `TAG_CHANGE Entity=177 tag=479 value=2`, so the deck card must participate in cost
 * resolution.
 *
 * Run:
 *   export HS_REFERENCE_CARDS_JSON_PATH=https://raw.githubusercontent.com/Zero-to-Heroes/hs-reference-data/master/src/cards_short.json
 *   npx jest test-tools/bugs/onyxia-herald/power-log-onyxia-herald-replay.spec.ts --config=libs/game-state/jest.config.ts --runInBand
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

/** Grounded in onyxia-herald.log SHOW_ENTITY for entity 177 (CATA_155t). */
const STORED_MINION_COST = 4;
const WING_ENTITY_ID = 177;

describe('Power log replay → GameStateService (Onyxia’s Wing pool cost)', () => {
	it('fixture log contains upgraded Onyxia’s Wing with TAG_SCRIPT_DATA_NUM_1=4 on SHOW_ENTITY', () => {
		const logPath = resolvePowerLogPathForSlug('onyxia-herald');
		requirePowerLogFixtureExists(logPath);
		const raw = fs.readFileSync(logPath, 'utf8');
		const lines = trimPowerLogLinesToLastGame(raw.split(/\r?\n/));
		const showIdx = lines.findIndex(
			(l) => l.includes('SHOW_ENTITY - Updating Entity=177 CardID=CATA_155t'),
		);
		expect(showIdx).toBeGreaterThan(-1);
		const snippet = lines.slice(showIdx, showIdx + 25).join('\n');
		expect(snippet).toContain('tag=TAG_SCRIPT_DATA_NUM_1 value=4');
	});

	it(
		'replays onyxia-herald.log; dynamic pool for Onyxia’s Wing uses upgraded cost (4), not parser-only 2',
		async () => {
			const logPath = resolvePowerLogPathForSlug('onyxia-herald');
			const cardsPath = resolveCardsJsonPath();
			requirePowerLogReplayPrerequisites(cardsPath, logPath);
			const ctx = await replayPowerLogToGameState({
				logPath,
				reviewId: 'onyxia-herald-power-log-replay',
			});
			requirePowerLogReplayResult(ctx, cardsPath);

			const wings = collectAllDeckCards(ctx.state).filter(
				(c) =>
					c.entityId === WING_ENTITY_ID &&
					(c.cardId === CardIds.ArisenOnyxia_OnyxiasWingToken_CATA_155t ||
						c.cardId === CardIds.ArisenOnyxia_OnyxiasWingToken_CATA_155t1),
			);
			expect(wings.length).toBeGreaterThan(0);
			const wing = wings.find((c) => c.zone === 'PLAY') ?? wings[wings.length - 1]!;

			const ownerDeck =
				ctx.state.playerDeck.board.some((c) => c.entityId === wing.entityId) ||
				ctx.state.playerDeck.hand.some((c) => c.entityId === wing.entityId)
					? ctx.state.playerDeck
					: ctx.state.opponentDeck;

			const heroClass: CardClass | undefined = ownerDeck.hero?.classes?.[0];
			const currentClass = heroClass ? CardClass[heroClass] : '';

			const rawPool = getDynamicRelatedCardIds(wing.cardId, wing.entityId, ctx.allCardsRef, {
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
