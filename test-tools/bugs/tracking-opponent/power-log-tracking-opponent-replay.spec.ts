/**
 * Tracking (CORE_DS1_184): "Discover a card from your deck."
 *
 * Regression: an opponent's private Tracking choice must move the real deck entity to their hand
 * without exposing its identity or leaving the log-revealed card as a concrete opponent deck row.
 *
 * Fixture anchors: opponent player 2 chooses SETASIDE entity 139, revealed in the log as
 * TIME_609t2 with COPIED_FROM_ENTITY_ID=62; source entity 62 then moves DECK → HAND.
 *
 * Run:
 *   npm exec nx test game-state -- --testPathPatterns=power-log-tracking-opponent-replay --runInBand
 */
import * as fs from 'fs';
import {
	replayPowerLogToGameState,
	requirePowerLogFixtureExists,
	requirePowerLogReplayPrerequisites,
	requirePowerLogReplayResult,
	resolveCardsJsonPath,
	resolvePowerLogPathForSlug,
} from '../../lib/power-log-replay-harness';
import { parseTrackingOpponentFixture } from './tracking-opponent-power-log-helpers';

describe('Power log replay → GameStateService (opponent Tracking choice remains private)', () => {
	it('grounds the chosen Tracking card and deck-to-hand move in the fixture', () => {
		const logPath = resolvePowerLogPathForSlug('tracking-opponent');
		requirePowerLogFixtureExists(logPath);
		const fixture = parseTrackingOpponentFixture(fs.readFileSync(logPath, 'utf8').split(/\r?\n/));

		expect(fixture.opponentPlayerId).toBe(2);
		expect(fixture.discoverChoiceId).toBe(6);
		expect(fixture.discoverOptionEntityIds).toEqual([139, 140, 138]);
		expect(fixture.pickedSetAsideEntityId).toBe(139);
		expect(fixture.pickedDeckEntityId).toBe(62);
		expect(fixture.pickedCardId).toBe('TIME_609t2');
	});

	it('replays tracking-opponent.log: picked card is hidden in hand and absent from concrete deck rows', async () => {
		const logPath = resolvePowerLogPathForSlug('tracking-opponent');
		const cardsPath = resolveCardsJsonPath();
		requirePowerLogReplayPrerequisites(cardsPath, logPath);
		const fixture = parseTrackingOpponentFixture(fs.readFileSync(logPath, 'utf8').split(/\r?\n/));

		const ctx = await replayPowerLogToGameState({
			logPath,
			reviewId: 'tracking-opponent-power-log-replay',
			settleMs: 60_000,
		});
		requirePowerLogReplayResult(ctx, cardsPath);

		try {
			expect(ctx.state.localPlayerId).not.toBe(fixture.opponentPlayerId);

			const pickedHandCard = ctx.state.opponentDeck.hand.find(
				(card) => (card.entityId ?? card.trueEntityId) === fixture.pickedDeckEntityId,
			);
			expect(pickedHandCard).toBeDefined();
			expect(pickedHandCard?.cardId).toBeFalsy();

			const sourceStillInDeck = ctx.state.opponentDeck.deck.filter(
				(card) => (card.entityId ?? card.trueEntityId) === fixture.pickedDeckEntityId,
			);
			expect(sourceStillInDeck).toEqual([]);

			// Do not inspect additionalKnownCardsInDeck: the Windrunner Fabled package can
			// legitimately contribute static package knowledge independently of this private choice.
			const leakedConcreteDeckRows = ctx.state.opponentDeck.deck.filter(
				(card) => card.cardId === fixture.pickedCardId,
			);
			expect(leakedConcreteDeckRows).toEqual([]);
		} finally {
			ctx.cleanup();
		}
	}, 300_000);
});
