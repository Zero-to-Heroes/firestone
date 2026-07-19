/**
 * Integration test: replay `hive-map-whelp.log` through GameEvents + GameStateService,
 * then assert Hive Map's dynamic discover pool is Fel spells (not Winterspring Whelp's 1-mana Frost pool)
 * when Hive Map was created by Winterspring Whelp.
 *
 * Run:
 *   export HS_REFERENCE_CARDS_JSON_PATH=https://raw.githubusercontent.com/Zero-to-Heroes/hs-reference-data/master/src/cards_short.json
 *   npx jest test-tools/bugs/hive-map-whelp/power-log-hivemap-replay.spec.ts --config=libs/game-state/jest.config.ts --runInBand
 */
import { CardClass, CardIds, SpellSchool } from '@firestone-hs/reference-data';
import {
	DeckCard,
	DeckState,
	GameState,
	getDynamicRelatedCardIds,
	hasCorrectSpellSchool,
	hasOverride,
} from '@firestone/game-state';
import {
	collectAllDeckCards,
	replayPowerLogToGameState,
	requirePowerLogReplayPrerequisites,
	requirePowerLogReplayResult,
	resolveCardsJsonPath,
	resolvePowerLogPathForSlug,
} from '../../lib/power-log-replay-harness';

function findDeckStatesForEntity(
	state: GameState,
	entityId: number,
): { owner: DeckState; opponent: DeckState } {
	if (state.playerDeck.findCard(entityId)) {
		return { owner: state.playerDeck, opponent: state.opponentDeck };
	}
	if (state.opponentDeck.findCard(entityId)) {
		return { owner: state.opponentDeck, opponent: state.playerDeck };
	}
	throw new Error(`[hivemap replay] No zone contains entity ${entityId}`);
}

describe('Power log replay → GameStateService (Hive Map pool vs Winterspring Whelp creator)', () => {
	const hiveMapId = CardIds.HiveMap_TLC_900;
	const winterspringWhelpId = CardIds.WinterspringWhelp_CATA_484;

	it(
		'replays hive-map-whelp.log: Hive Map from Whelp uses Fel discover pool, not Whelp Frost pool',
		async () => {
			const logPath = resolvePowerLogPathForSlug('hivemap');
			const cardsPath = resolveCardsJsonPath();
			requirePowerLogReplayPrerequisites(cardsPath, logPath);

			const ctx = await replayPowerLogToGameState({
				logPath,
				reviewId: 'hivemap-power-log-replay',
			});
			requirePowerLogReplayResult(ctx, cardsPath);

			const hiveFromWhelp = collectAllDeckCards(ctx.state).filter(
				(c) => c.cardId === hiveMapId && c.creatorCardId === winterspringWhelpId,
			);
			expect(hiveFromWhelp.length).toBeGreaterThan(0);

			const { allCardsRef, state } = ctx;
			for (const zoneCard of hiveFromWhelp) {
				const dc = zoneCard as DeckCard;
				const { owner, opponent } = findDeckStatesForEntity(state, dc.entityId);
				const currentClass = owner.hero?.classes?.[0] ? CardClass[owner.hero.classes[0]] : '';

				const rawPool = getDynamicRelatedCardIds(dc.cardId!, dc.entityId, allCardsRef, {
					format: state.metadata.formatType,
					gameType: state.metadata.gameType,
					scenarioId: state.metadata.scenarioId,
					currentClass,
					deckState: owner,
					opponentDeckState: opponent,
					gameState: state,
					validArenaPool: [],
				});
				const pool: readonly string[] = hasOverride(rawPool)
					? (rawPool as { cards: readonly string[] }).cards
					: rawPool;

				expect(pool.length).toBeGreaterThan(0);

				const notFel = pool.filter((id) => {
					const ref = allCardsRef.getCard(id);
					return !ref || !hasCorrectSpellSchool(ref, SpellSchool.FEL);
				});
				expect(notFel).toEqual([]);
			}
		},
		180_000,
	);
});
