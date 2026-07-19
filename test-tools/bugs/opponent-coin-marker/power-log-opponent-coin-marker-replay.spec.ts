/**
 * Regression: Underground Arena (GT_UNDERGROUND_ARENA) — opponent goes second; entity 70 is The Coin at
 * zone position 5 with empty CardID in the log. The power-log parser infers `GAME_005` for that slot;
 * `ReceiveCardInHandParser` must treat coins as public for the opponent (`isCoin`) so `cardId` is not
 * stripped — otherwise the deck tracker hand marker cannot render.
 *
 * **Why this matches the report:** In the fixture, local player is FIRST_PLAYER (GameState Entity=2);
 * opponent (player=2) has the extra hand slot at zone position 5 (entity 70) with no CardID — that is
 * The Coin. Showing The Coin is not an information leak (both players know who has it).
 *
 * Fixture: last game from support `ad5ae2c6-037d-4d35-9991-19622301a489.power.zip`, trimmed to last game
 * then truncated to the first 1000 lines (opening + mulligan; ends during BEGIN_MULLIGAN) to keep size down.
 *
 * Run:
 *   export HS_REFERENCE_CARDS_JSON_PATH=https://raw.githubusercontent.com/Zero-to-Heroes/hs-reference-data/master/src/cards_short.json
 *   npx jest test-tools/bugs/opponent-coin-marker/power-log-opponent-coin-marker-replay.spec.ts --config=libs/game-state/jest.config.ts --runInBand
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

/** From fixture: second player's coin entity in opening hand (CONTROLLER value=2, ZONE_POSITION=5). */
const opponentCoinEntityId = 70;

describe('Power log replay → GameStateService (opponent coin marker at game start)', () => {
	it('maps opponent starting coin entity to The Coin (GAME_005) in opponent hand', async () => {
		const logPath = resolvePowerLogPathForSlug('opponent-coin-marker');
		const cardsPath = resolveCardsJsonPath();
		requirePowerLogReplayPrerequisites(cardsPath, logPath);

		const ctx = await replayPowerLogToGameState({
			logPath,
			reviewId: 'opponent-coin-marker-replay',
		});
		requirePowerLogReplayResult(ctx, cardsPath);

		const { state } = ctx;
		const coinCard = collectAllDeckCards(state).find((c) => c.entityId === opponentCoinEntityId);

		expect(coinCard).toBeDefined();
		expect(coinCard!.cardId).toBe(CardIds.TheCoinCore);
	}, 180_000);
});
