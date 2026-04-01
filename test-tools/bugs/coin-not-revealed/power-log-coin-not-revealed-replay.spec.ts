/**
 * Regression: cosmetic set coins (e.g. TLC_COIN2) must map to The Coin (GAME_005) in deck state so the
 * tracker shows the standard art/name. Uses COIN_CARD=1 on RECEIVE_CARD_IN_HAND; falls back when the id
 * is missing from cards_short.json (/_COIN/ heuristic).
 *
 * Fixture: trimmed opening; coin entity id=69, CardID=TLC_COIN2, COIN_CARD=1.
 *
 * Run (set cards DB — sibling hs-reference-data or HS_REFERENCE_CARDS_JSON_PATH):
 *   export HS_REFERENCE_CARDS_JSON_PATH=../hs-reference-data/src/cards_short.json
 *   npx jest test-tools/bugs/coin-not-revealed/power-log-coin-not-revealed-replay.spec.ts --config=libs/game-state/jest.config.ts --runInBand
 */
import { CardIds } from '@firestone-hs/reference-data';
import {
	collectAllDeckCards,
	replayPowerLogToGameState,
	requirePowerLogReplayPrerequisites,
	requirePowerLogReplayResult,
	resolveCardsJsonPath,
	resolvePowerLogPathForSlug,
} from '../../lib/power-log-replay-harness';

/** From fixture: second player's coin entity in opening hand. */
const coinEntityId = 69;

describe('Power log replay → GameStateService (cosmetic coin id revealed as The Coin)', () => {
	it('maps TLC_COIN2 with COIN_CARD to CardIds.TheCoinCore (GAME_005) in hand', async () => {
		const logPath = resolvePowerLogPathForSlug('coin-not-revealed');
		const cardsPath = resolveCardsJsonPath();
		requirePowerLogReplayPrerequisites(cardsPath, logPath);

		const ctx = await replayPowerLogToGameState({
			logPath,
			reviewId: 'coin-not-revealed-replay',
			settleMs: 12_000,
		});
		requirePowerLogReplayResult(ctx, cardsPath);

		const { state } = ctx;
		const coinCard = collectAllDeckCards(state).find((c) => c.entityId === coinEntityId);

		expect(coinCard).toBeDefined();
		expect(coinCard!.cardId).toBe(CardIds.TheCoinCore);
	}, 120_000);
});
