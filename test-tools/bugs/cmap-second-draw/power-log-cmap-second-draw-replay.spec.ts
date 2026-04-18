/**
 * Cultist Map second draw (support log 05638067…): opponent must not reveal the dredged card id
 * (CATA_158) on the real hand entity for the observer.
 *
 * Fixture is trimmed after PowerTaskList ends task list 192 (~line 5669): stops before combat so
 * entity 51 stays in HAND for assertions (full match would play the minion and vacuously pass).
 *
 * Ground truth (~5441–5642 PowerTaskList): entity 51 DECK→HAND with no cardId; SHOW_ENTITY id=117
 * CardID=CATA_158, COPIED_FROM_ENTITY_ID=51, LINKED_ENTITY=51.
 *
 * Run:
 *   export HS_REFERENCE_CARDS_JSON_PATH=https://raw.githubusercontent.com/Zero-to-Heroes/hs-reference-data/master/src/cards_short.json
 *   npx jest test-tools/bugs/cmap-second-draw/power-log-cmap-second-draw-replay.spec.ts --config=libs/game-state/jest.config.ts --runInBand
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

/** Revealed on SHOW_ENTITY for entity 117 in cmap-second-draw.log — must not appear on opponent hand slot 51 for the observer. */
const LEAKED_CARD_ID = 'CATA_158';
/** Deck card entity that moves to hand on Cultist Map enchant second pick (see log ~5546–5548). */
const DREDGED_DECK_ENTITY_ID = 51;

describe('Power log replay → Cultist Map second draw (cmap-second-draw, no hand identity leak)', () => {
	it(
		'replays cmap-second-draw.log: opponent hand must not expose CATA_158 on dredged slot',
		async () => {
			const logPath = resolvePowerLogPathForSlug('cmap-second-draw');
			requirePowerLogFixtureExists(logPath);
			const cardsPath = resolveCardsJsonPath();
			requirePowerLogReplayPrerequisites(cardsPath, logPath);

			const ctx = await replayPowerLogToGameState({
				logPath,
				reviewId: 'cmap-second-draw-replay',
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
