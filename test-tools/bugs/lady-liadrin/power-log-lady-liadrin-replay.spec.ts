/**
 * Regression: Lady Liadrin battlecry adds copies of spells cast on friendly characters; those hand
 * cards should carry guessedInfo.possibleCards from spellsPlayedOnFriendlyEntities (order preserved,
 * duplicates allowed). Multiple distinct spells are added in random order — no per-card id guess
 * except when only one distinct spell qualifies (then guessCardId can resolve).
 *
 * Fixture: `lady-liadrin.log` — last game from reporter power.zip (86584c66-a8b6-48ad-aa39-ad7f1e2fc5b9).
 * Override: `POWER_LOG_LADY_LIADRIN_PATH`, `HS_REFERENCE_CARDS_JSON_PATH`.
 *
 * Run:
 *   npx jest test-tools/bugs/lady-liadrin/power-log-lady-liadrin-replay.spec.ts --config=libs/game-state/jest.config.ts --runInBand
 */
import { CardIds } from '@firestone-hs/reference-data';
import { DeckCard, DeckState, GameState } from '@firestone/game-state';
import {
	collectAllDeckCards,
	replayPowerLogToGameState,
	requirePowerLogFixtureExists,
	requirePowerLogReplayPrerequisites,
	requirePowerLogReplayResult,
	resolveCardsJsonPath,
	resolvePowerLogPathForSlug,
} from '../../lib/power-log-replay-harness';

const LIADRIN_CREATOR_IDS: readonly CardIds[] = [CardIds.LadyLiadrin, CardIds.LadyLiadrin_CORE_BT_334];

function friendlySpellCardIdsInOrder(deck: DeckState): string[] {
	const out: string[] = [];
	for (const s of deck.spellsPlayedOnFriendlyEntities ?? []) {
		const id = s.cardId;
		if (id?.length) {
			out.push(id);
		}
	}
	return out;
}

/** Multiset equality (order ignored). */
function sortedCopy(ids: readonly string[]): string[] {
	return [...ids].sort();
}

function deckContainingEntity(state: GameState, entityId: number): DeckState | null {
	for (const deck of [state.playerDeck, state.opponentDeck]) {
		if (deck.findCard(entityId)) {
			return deck;
		}
	}
	return null;
}

describe('Power log replay → GameStateService (Lady Liadrin spell pool)', () => {
	it(
		'replays lady-liadrin.log: Liadrin-created hand cards expose possibleCards matching friendly-target spells (multiset)',
		async () => {
			const logPath = resolvePowerLogPathForSlug('lady-liadrin');
			requirePowerLogFixtureExists(logPath);
			const cardsPath = resolveCardsJsonPath();
			requirePowerLogReplayPrerequisites(cardsPath, logPath);

			const ctx = await replayPowerLogToGameState({
				logPath,
				reviewId: 'lady-liadrin-power-log-replay',
			});
			requirePowerLogReplayResult(ctx, cardsPath);

			const created = collectAllDeckCards(ctx.state).filter(
				(c) => !!c.creatorCardId && LIADRIN_CREATOR_IDS.includes(c.creatorCardId as CardIds),
			);
			expect(created.length).toBeGreaterThan(0);

			const expectedByDeck = new Map<DeckState, string[]>();
			for (const zoneCard of created) {
				const deck = deckContainingEntity(ctx.state, zoneCard.entityId);
				expect(deck).not.toBeNull();
				if (!expectedByDeck.has(deck!)) {
					expectedByDeck.set(deck!, friendlySpellCardIdsInOrder(deck!));
				}
				const expectedPool = expectedByDeck.get(deck!)!;
				expect(expectedPool.length).toBeGreaterThan(0);

				const dc = zoneCard as DeckCard;
				if (dc.cardId?.length) {
					expect(expectedPool).toContain(dc.cardId);
				} else {
					const pool = dc.guessedInfo?.possibleCards ?? [];
					expect(pool.length).toBeGreaterThan(0);
					expect(sortedCopy(pool)).toEqual(sortedCopy(expectedPool));
				}
			}
		},
		180_000,
	);
});
