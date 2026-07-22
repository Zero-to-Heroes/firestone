/**
 * Chainbreaker Hogger (JAIL_384)
 * Taunt. Start of Game: Duplicate all other Legendary cards in your deck.
 *
 * Red regression: after the Hogger Warptooth copy is summoned DECK→PLAY (RECRUIT_CARD),
 * opponentDeck must drop that "Created by Chainbreaker Hogger" row. Pre-fix the tracker
 * keeps 3 gifts instead of 2 (Egg left via draw/play; Warptooth copy should leave via recruit).
 *
 * Run:
 *   export HS_REFERENCE_CARDS_JSON_PATH=https://raw.githubusercontent.com/Zero-to-Heroes/hs-reference-data/master/src/cards_short.json
 *   npx jest test-tools/bugs/chainbreaker-hogger-summon-from-deck/power-log-chainbreaker-hogger-summon-from-deck-replay.spec.ts --config=libs/game-state/jest.config.ts --runInBand
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
	CHAINBREAKER_HOGGER_CARD_ID,
	CHAINBREAKER_HOGGER_SUMMON_FROM_DECK_LOG_PATH,
	HOGGER_CONTROLLER_ID,
	parseChainbreakerHoggerSummonFromDeckCounts,
	WARPTOOTH_CARD_ID,
} from './chainbreaker-hogger-summon-from-deck-power-log-helpers';

describe('Power log replay → Chainbreaker Hogger summon-from-deck gift count', () => {
	const hoggerCreator = CardIds.ChainbreakerHogger_JAIL_384;

	it('parses Hogger created / drawn / summoned counts from fixture log', () => {
		const logPath = resolvePowerLogPathForSlug('chainbreaker-hogger-summon-from-deck');
		expect(logPath).toBe(CHAINBREAKER_HOGGER_SUMMON_FROM_DECK_LOG_PATH);
		requirePowerLogFixtureExists(logPath);

		const raw = fs.readFileSync(logPath, 'utf8');
		const counts = parseChainbreakerHoggerSummonFromDeckCounts(raw.split(/\r?\n/));

		expect(counts.createdInDeckEntityIds).toEqual([70, 71, 72, 73]);
		expect(counts.drawnFromDeckEntityIds).toEqual([71]);
		expect(counts.summonedFromDeckEntityIds).toEqual([70]);
		expect(counts.expectedRemainingInDeck).toBe(2);
		expect(CHAINBREAKER_HOGGER_CARD_ID).toBe(hoggerCreator);
	});

	it('replays log: opponent Hogger gift count drops when Warptooth copy is summoned from deck', async () => {
		const logPath = resolvePowerLogPathForSlug('chainbreaker-hogger-summon-from-deck');
		const cardsPath = resolveCardsJsonPath();
		requirePowerLogReplayPrerequisites(cardsPath, logPath);

		const raw = fs.readFileSync(logPath, 'utf8');
		const counts = parseChainbreakerHoggerSummonFromDeckCounts(raw.split(/\r?\n/));
		expect(counts.expectedRemainingInDeck).toBe(2);

		const ctx = await replayPowerLogToGameState({
			logPath,
			reviewId: 'chainbreaker-hogger-summon-from-deck',
		});
		requirePowerLogReplayResult(ctx, cardsPath);

		try {
			expect(ctx.state.localPlayerId).not.toBe(HOGGER_CONTROLLER_ID);

			const hoggerGiftsInOpponentDeck = ctx.state.opponentDeck.deck.filter(
				(c) => c.creatorCardId === hoggerCreator,
			);
			expect(hoggerGiftsInOpponentDeck.length).toBe(counts.expectedRemainingInDeck);

			const warptoothOnBoard = ctx.state.opponentDeck.board.filter((c) => c.cardId === WARPTOOTH_CARD_ID);
			expect(warptoothOnBoard.length).toBeGreaterThanOrEqual(2);
		} finally {
			ctx.cleanup();
		}
	}, 300_000);
});
