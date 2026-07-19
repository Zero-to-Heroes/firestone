/**
 * Chainbreaker Hogger (JAIL_384)
 * Taunt. Start of Game: Duplicate all other Legendary cards in your deck.
 *
 * Red regression: the full supplied power.log must not propagate revealed Hogger copy entity 70's
 * identity back to original entity 26, which remains hidden in the opponent hand.
 *
 * Run:
 *   npm exec -- nx run game-state:test --testFile=test-tools/bugs/chainbreaker-hogger-draw-reveal/power-log-chainbreaker-hogger-draw-reveal-replay.spec.ts --runInBand --skipNxCache
 */
import { CardIds } from '@firestone-hs/reference-data';
import { getDisplayCardIdWhenGuessedPoolIsSingleCard } from '@firestone/game-state';
import * as fs from 'fs';
import {
	replayPowerLogToGameState,
	requirePowerLogFixtureExists,
	requirePowerLogReplayPrerequisites,
	requirePowerLogReplayResult,
	resolveCardsJsonPath,
} from '../../lib/power-log-replay-harness';
import {
	CHAINBREAKER_HOGGER_DRAW_REVEAL_LOG_PATH,
	EGG_OF_KHELOS_CARD_ID,
	HOGGER_CONTROLLER_ID,
	ORIGINAL_EGG_ENTITY_ID,
	parseChainbreakerHoggerDrawRevealMarkers,
	prepareChainbreakerHoggerDrawRevealLines,
} from './chainbreaker-hogger-draw-reveal-power-log-helpers';

describe('Power log replay → Chainbreaker Hogger generated-card draw remains hidden', () => {
	it('fixture creates entity 70 hidden, draws it without SHOW_ENTITY, then reveals it as Egg only on play', () => {
		const logPath = CHAINBREAKER_HOGGER_DRAW_REVEAL_LOG_PATH;
		requirePowerLogFixtureExists(logPath);

		const lines = prepareChainbreakerHoggerDrawRevealLines(fs.readFileSync(logPath, 'utf8'));
		const markers = parseChainbreakerHoggerDrawRevealMarkers(lines);

		expect(markers.generatedEggCardId).toBe(CardIds.TheEggOfKhelos_DINO_410);
		expect(markers.generatedEggCopiedFromIndex).toBeLessThan(lines.length);
		expect(lines.length).toBeGreaterThan(markers.generatedEggPlayEndIndex + 1);
	});

	it('keeps original entity 26 hidden after replaying the complete supplied log', async () => {
		const logPath = CHAINBREAKER_HOGGER_DRAW_REVEAL_LOG_PATH;
		const cardsPath = resolveCardsJsonPath();
		requirePowerLogReplayPrerequisites(cardsPath, logPath);

		const lines = prepareChainbreakerHoggerDrawRevealLines(fs.readFileSync(logPath, 'utf8'));
		const ctx = await replayPowerLogToGameState({
			logPath,
			// Supplying every raw line bypasses the harness's automatic last-game trimming.
			logLinesOverride: lines,
			reviewId: 'chainbreaker-hogger-draw-reveal',
			settleMs: 20_000,
		});
		requirePowerLogReplayResult(ctx, cardsPath);

		try {
			expect(ctx.state.localPlayerId).not.toBe(HOGGER_CONTROLLER_ID);
			const hoggerDeck =
				ctx.state.localPlayerId === HOGGER_CONTROLLER_ID ? ctx.state.playerDeck : ctx.state.opponentDeck;
			const originalCardInHand = hoggerDeck.hand.find(
				(card) => Math.abs(card.entityId ?? card.trueEntityId ?? 0) === ORIGINAL_EGG_ENTITY_ID,
			);
			expect(originalCardInHand).toBeDefined();
			expect(originalCardInHand!.cardId).toBeFalsy();
			expect(originalCardInHand!.cardName).not.toBe(ctx.allCardsRef.getCard(EGG_OF_KHELOS_CARD_ID)?.name);
			expect(
				originalCardInHand!.cardId || getDisplayCardIdWhenGuessedPoolIsSingleCard(originalCardInHand!),
			).toBeFalsy();
		} finally {
			ctx.cleanup();
		}
	}, 300_000);
});
