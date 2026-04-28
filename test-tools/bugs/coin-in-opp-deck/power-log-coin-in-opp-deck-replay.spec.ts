/**
 * Regression: tracker shows a "The Coin" entry (cost displayed as 3,
 * "Created by Agent of the Old Ones") in the opponent's `deck` zone after a
 * Rewind sequence. The Coin should never appear in `opponentDeck.deck` — coins
 * are added to hand at game start (or transformed in hand by `CATA_200`), and
 * the engine never moves the entity into the opponent's DECK zone.
 *
 * Fixture (`coin-in-opp-deck.log`, ~42.6k lines, single game, pre-trimmed by
 * the reporter): Mage (P1) vs Rogue (P2, opponent).
 *  - Opponent's starting cosmetic coin `BAR_COIN3` (id 68) is played T1 → GRAVEYARD.
 *  - Player triggers Rewind 1 via Blessing of the Bronze (`END_000p`, line 6901).
 *  - Opponent draws an unknown deck card (id 76) → HAND, then plays Agent of
 *    the Old Ones (`CATA_200`, id 62) targeting id 76 — `DISPLAYED_CREATOR=62`
 *    is set on id 76, which transforms into the Coin in hand and is then
 *    played (`SHOW_ENTITY ... CardID=BAR_COIN3`, line 26561).
 *  - Player triggers Rewind 2 (line 28888). The GAME_RESET FULL_ENTITY for
 *    id 76 (line 30180) places it in `zone=GRAVEYARD` with `cardId=BAR_COIN3`,
 *    `CREATOR=DISPLAYED_CREATOR=62`. The engine never puts the Coin in DECK.
 *
 * Bug invariant: `opponentDeck.deck` must contain zero Coin entries at the
 * end of replay. Pre-fix the fixture leaves one phantom Coin slot
 * ("Created by Agent of the Old Ones") in `opponentDeck.deck`.
 *
 * Run:
 *   export HS_REFERENCE_CARDS_JSON_PATH=https://raw.githubusercontent.com/Zero-to-Heroes/hs-reference-data/master/src/cards_short.json
 *   npx jest test-tools/bugs/coin-in-opp-deck/power-log-coin-in-opp-deck-replay.spec.ts --config=libs/game-state/jest.config.ts --runInBand
 */
import { CardIds } from '@firestone-hs/reference-data';
import {
	replayPowerLogToGameState,
	requirePowerLogReplayPrerequisites,
	requirePowerLogReplayResult,
	resolveCardsJsonPath,
	resolvePowerLogPathForSlug,
} from '../../lib/power-log-replay-harness';

describe('Power log replay → GameStateService (Coin must not appear in opponent deck after Rewind + Agent of the Old Ones)', () => {
	it(
		'reporter log: opponentDeck.deck contains no Coin entry at end of replay',
		async () => {
			const logPath = resolvePowerLogPathForSlug('coin-in-opp-deck');
			const cardsPath = resolveCardsJsonPath();
			requirePowerLogReplayPrerequisites(cardsPath, logPath);

			const ctx = await replayPowerLogToGameState({
				logPath,
				reviewId: 'coin-in-opp-deck-replay',
				// ~42.6k lines incl. two rewinds; give the GS+PTL queues room to drain.
				settleMs: 20_000,
			});
			requirePowerLogReplayResult(ctx, cardsPath);

			const oppDeck = ctx.state.opponentDeck.deck;
			const phantomCoins = oppDeck.filter(
				(c) =>
					!!c.cardId &&
					(c.cardId === CardIds.TheCoinCore ||
						ctx.allCardsRef.getCard(c.cardId)?.isCoin === true),
			);
			expect(phantomCoins).toEqual([]);
		},
		300_000,
	);
});
