/**
 * Opponent dredge must not reveal the chosen card to the local player (COPIED_FROM_ENTITY_ID path).
 * The deck slot should stay unknown with dredge metadata and top-of-deck position.
 *
 * Run:
 *   export HS_REFERENCE_CARDS_JSON_PATH=https://raw.githubusercontent.com/Zero-to-Heroes/hs-reference-data/master/src/cards_short.json
 *   npx jest test-tools/bugs/dredge-info-leak/power-log-dredge-info-leak-replay.spec.ts --config=libs/game-state/jest.config.ts --runInBand
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

/** Swordfish — revealed in log when opponent dredges; must not appear on opponent deck list for local player. */
const DREDGED_CARD_ID = 'TSC_086';
/** Tuskarrrr Trawler — dredger on board in fixture. */
const DREDGER_CARD_ID = 'TSC_909';

describe('Power log replay → opponent dredge (no deck identity leak)', () => {
	it(
		'replays dredge-info-leak.log: opponent deck must not gain known TSC_086 from dredge; top slot dredged by TSC_909',
		async () => {
			const logPath = resolvePowerLogPathForSlug('dredge-info-leak');
			requirePowerLogFixtureExists(logPath);
			const cardsPath = resolveCardsJsonPath();
			requirePowerLogReplayPrerequisites(cardsPath, logPath);

			const ctx = await replayPowerLogToGameState({
				logPath,
				reviewId: 'dredge-info-leak-replay',
				settleMs: 12_000,
			});
			requirePowerLogReplayResult(ctx, cardsPath);

			const opponentDeckCards = collectAllDeckCards(ctx.state).filter((c) =>
				ctx.state.opponentDeck.deck.includes(c as DeckCard),
			);
			const leaked = opponentDeckCards.filter((c) => c.cardId === DREDGED_CARD_ID);
			expect(leaked).toEqual([]);

			const topDredged = ctx.state.opponentDeck.deck.filter(
				(c) =>
					c.dredged &&
					c.positionFromTop != null &&
					c.lastAffectedByCardId === DREDGER_CARD_ID,
			);
			expect(topDredged.length).toBeGreaterThan(0);
		},
		180_000,
	);
});
