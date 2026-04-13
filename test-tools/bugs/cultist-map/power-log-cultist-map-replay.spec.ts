/**
 * Cultist Map second draw (dredge copy): opponent must not reveal the dredged card id (TSC_909) to the local player.
 *
 * Run:
 *   export HS_REFERENCE_CARDS_JSON_PATH=https://raw.githubusercontent.com/Zero-to-Heroes/hs-reference-data/master/src/cards_short.json
 *   npx jest test-tools/bugs/cultist-map/power-log-cultist-map-replay.spec.ts --config=libs/game-state/jest.config.ts --runInBand
 */
import { DeckCard } from '@firestone/game-state';
import {
	collectAllDeckCards,
	replayPowerLogToGameState,
	requirePowerLogFixtureExists,
	requirePowerLogReplayPrerequisites,
	requirePowerLogReplayResult,
	resolveCardsJsonPath,
	resolvePowerLogPathForSlug,
} from '../../lib/power-log-replay-harness';

/** Revealed on SHOW_ENTITY for entity 93 / deck entity 39 in cultist-map.log — must not appear on opponent hand slot for the observer. */
const LEAKED_CARD_ID = 'TSC_909';
/** Deck card entity that moves to hand on Cultist Map enchant dredge (see log ~3910–3913). */
const DREDGED_DECK_ENTITY_ID = 39;

describe('Power log replay → Cultist Map second draw (no hand identity leak)', () => {
	it(
		'replays cultist-map.log: opponent hand must not expose TSC_909 on dredged slot; may track dredge + Cultist Map',
		async () => {
			const logPath = resolvePowerLogPathForSlug('cultist-map');
			requirePowerLogFixtureExists(logPath);
			const cardsPath = resolveCardsJsonPath();
			requirePowerLogReplayPrerequisites(cardsPath, logPath);

			const ctx = await replayPowerLogToGameState({
				logPath,
				reviewId: 'cultist-map-replay',
				settleMs: 12_000,
			});
			requirePowerLogReplayResult(ctx, cardsPath);

			const opponentHand = ctx.state.opponentDeck.hand;
			const dredgedSlot = opponentHand.find((c) => c.entityId === DREDGED_DECK_ENTITY_ID) as DeckCard | undefined;
			expect(dredgedSlot?.cardId).not.toBe(LEAKED_CARD_ID);

			const opponentCards = collectAllDeckCards(ctx.state).filter((c) =>
				ctx.state.opponentDeck.deck.includes(c as DeckCard),
			);
			const leakedInDeck = opponentCards.filter((c) => c.cardId === LEAKED_CARD_ID);
			expect(leakedInDeck).toEqual([]);
		},
		180_000,
	);
});
