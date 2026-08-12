/**
 * Warptooth (JAIL_421) + Chainbreaker Hogger (JAIL_384)
 *
 * Red regression: after Hogger doubles Warptooth in the local player's deck and both copies are
 * summoned DECK→PLAY in the same turn, the deck tracker must not still show a Warptooth remaining
 * in deck (grouped list uses `deck` quantity; dim only when quantity is 0).
 *
 * Fixture: `warptooth.log` — last game from support power.log, truncated after both summons.
 *
 * Run:
 *   export HS_REFERENCE_CARDS_JSON_PATH=https://raw.githubusercontent.com/Zero-to-Heroes/hs-reference-data/master/src/cards_short.json
 *   npx jest test-tools/bugs/warptooth/power-log-warptooth-replay.spec.ts --config=libs/game-state/jest.config.ts --runInBand
 */
import { CardIds } from '@firestone-hs/reference-data';
import * as fs from 'fs';
import {
	replayPowerLogToGameState,
	requirePowerLogFixtureExists,
	requirePowerLogReplayPrerequisites,
	requirePowerLogReplayResult,
	resolveCardsJsonPath,
	resolvePowerLogPathForSlug,
} from '../../lib/power-log-replay-harness';
import {
	HOGGER_WARPTOOTH_COPY_ENTITY_ID,
	ORIGINAL_WARPTOOTH_ENTITY_ID,
	parseWarptoothDualSummonMarkers,
	WARPTOOTH_CARD_ID,
	WARPTOOTH_CONTROLLER_ID,
	WARPTOOTH_LOG_PATH,
} from './warptooth-power-log-helpers';

/** 战龙闪 — from app logs for this fixture game (includes JAIL_421 + JAIL_384). */
const PLAYER_DECKSTRING =
	'AAECAQcMqfUGsf0Gw4MHpYUH7o8HmbEH0L8HucMHzskHm9QH69YHstgHCYagBI7UBOPmBuiHB4+xB42+B4++B6/BB6DFBwAA';

describe('Power log replay → Warptooth simultaneous summon deck list', () => {
	const warptoothId = CardIds.Warptooth_JAIL_421;

	it('parses Hogger Warptooth copy + dual DECK→PLAY summons from fixture log', () => {
		const logPath = resolvePowerLogPathForSlug('warptooth');
		expect(logPath).toBe(WARPTOOTH_LOG_PATH);
		requirePowerLogFixtureExists(logPath);

		const raw = fs.readFileSync(logPath, 'utf8');
		const markers = parseWarptoothDualSummonMarkers(raw.split(/\r?\n/));

		expect(markers.controllerId).toBe(WARPTOOTH_CONTROLLER_ID);
		expect(markers.hoggerCreatedWarptoothEntityId).toBe(HOGGER_WARPTOOTH_COPY_ENTITY_ID);
		expect(markers.originalWarptoothEntityId).toBe(ORIGINAL_WARPTOOTH_ENTITY_ID);
		expect(markers.originalSummonedToPlay).toBe(true);
		expect(markers.copySummonedToPlay).toBe(true);
		expect(WARPTOOTH_CARD_ID).toBe(warptoothId);
	});

	it('replays log: after both Warptooths are summoned, none remain in deck / deck list', async () => {
		const logPath = resolvePowerLogPathForSlug('warptooth');
		const cardsPath = resolveCardsJsonPath();
		requirePowerLogReplayPrerequisites(cardsPath, logPath);

		const raw = fs.readFileSync(logPath, 'utf8');
		const markers = parseWarptoothDualSummonMarkers(raw.split(/\r?\n/));
		expect(markers.originalSummonedToPlay && markers.copySummonedToPlay).toBe(true);

		const ctx = await replayPowerLogToGameState({
			logPath,
			reviewId: 'warptooth-power-log-replay',
			playerDeckstring: PLAYER_DECKSTRING,
		});
		requirePowerLogReplayResult(ctx, cardsPath);

		try {
			expect(ctx.state.localPlayerId).toBe(WARPTOOTH_CONTROLLER_ID);

			const warptoothOnBoard = ctx.state.playerDeck.board.filter((c) => c.cardId === warptoothId);
			expect(warptoothOnBoard.map((c) => c.entityId).sort((a, b) => a - b)).toEqual([
				ORIGINAL_WARPTOOTH_ENTITY_ID,
				HOGGER_WARPTOOTH_COPY_ENTITY_ID,
			]);

			// Grouped deck list treats quantityInDeck > 0 as "still in deck" (not dimmed).
			const warptoothStillInDeck = ctx.state.playerDeck.deck.filter((c) => c.cardId === warptoothId);
			expect(warptoothStillInDeck).toEqual([]);

			// Gift / list rows must not keep a live Warptooth either.
			const warptoothDeckListLive = ctx.state.playerDeck.deckList.filter(
				(c) => c.cardId === warptoothId && c.entityId != null && c.entityId > 0,
			);
			expect(warptoothDeckListLive).toEqual([]);
		} finally {
			ctx.cleanup();
		}
	}, 300_000);
});
