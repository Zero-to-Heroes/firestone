/**
 * Regression: Entity 12 (Chainbreaker Hogger) must stay linked to JAIL_384 in the player deck
 * after replaying `chainbreaker-hogger.log`.
 *
 * Bug trigger: `COPIED_FROM_ENTITY_ID` on entity 64 (JAIL_384, opponent deck),
 * copiedCardEntityId=12 — handled by `copied-from-entity-id-parser.ts`.
 *
 * Run:
 *   export HS_REFERENCE_CARDS_JSON_PATH=https://raw.githubusercontent.com/Zero-to-Heroes/hs-reference-data/master/src/cards_short.json
 *   npx jest test-tools/bugs/chainbreaker-hogger/power-log-chainbreaker-hogger-replay.spec.ts --config=libs/game-state/jest.config.ts --runInBand
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
import {
	BUG_TRIGGER_COPIED_FROM_SOURCE_ENTITY_ID,
	CHAINBREAKER_HOGGER_CARD_ID,
	CHAINBREAKER_HOGGER_ENTITY_ID,
	CHAINBREAKER_HOGGER_POWER_LOG_PATH,
	OPPONENT_HOGGER_COPY_ENTITY_ID,
	parseChainbreakerHoggerFixtureMarkers,
	PLAYER_DECKSTRING,
} from './chainbreaker-hogger-power-log-helpers';

describe('Power log replay → Chainbreaker Hogger deck identity (entity 12)', () => {
	it('fixture: chainbreaker-hogger.log contains SHOW_ENTITY revealing entity 12 as JAIL_384', () => {
		const logPath = resolvePowerLogPathForSlug('chainbreaker-hogger');
		expect(logPath).toBe(CHAINBREAKER_HOGGER_POWER_LOG_PATH);
		requirePowerLogFixtureExists(logPath);
		const raw = fs.readFileSync(logPath, 'utf8');
		const lines = raw.split(/\r?\n/).filter((line) => line.length > 0);
		expect(lines.some((line) => line.includes('CREATE_GAME'))).toBe(true);

		const markers = parseChainbreakerHoggerFixtureMarkers(lines);
		expect(markers.hoggerEntityId).toBe(CHAINBREAKER_HOGGER_ENTITY_ID);
		expect(markers.hoggerCardId).toBe(CHAINBREAKER_HOGGER_CARD_ID);
		expect(markers.hoggerRevealLineIndex).toBeGreaterThan(0);
		expect(markers.hoggerHideAfterRevealLineIndex).toBeGreaterThan(markers.hoggerRevealLineIndex);
		expect(markers.opponentHoggerCopyShowEntityLineIndex).toBeGreaterThan(0);
		expect(markers.opponentHoggerCopyCopiedFromLineIndex).toBeGreaterThan(
			markers.opponentHoggerCopyShowEntityLineIndex,
		);
		expect(lines[markers.opponentHoggerCopyShowEntityLineIndex]).toContain(
			`id=${OPPONENT_HOGGER_COPY_ENTITY_ID}`,
		);
		expect(lines[markers.opponentHoggerCopyCopiedFromLineIndex]).toContain(
			`COPIED_FROM_ENTITY_ID value=${BUG_TRIGGER_COPIED_FROM_SOURCE_ENTITY_ID}`,
		);
	});

	it(
		'replays chainbreaker-hogger.log with deckstring; player deck has no cards without a cardId',
		async () => {
			const logPath = resolvePowerLogPathForSlug('chainbreaker-hogger');
			const cardsPath = resolveCardsJsonPath();
			requirePowerLogReplayPrerequisites(cardsPath, logPath);

			const ctx = await replayPowerLogToGameState({
				logPath,
				playerDeckstring: PLAYER_DECKSTRING,
				reviewId: 'chainbreaker-hogger-power-log-replay',
			});
			requirePowerLogReplayResult(ctx, cardsPath);

			const cardsWithoutCardId = ctx.state.playerDeck.deck.filter((c) => !c.cardId?.length);
			expect(cardsWithoutCardId).toEqual([]);

			const hoggerLinkedToEntity12 = ctx.state.playerDeck.deck.find(
				(c) =>
					c.cardId === CHAINBREAKER_HOGGER_CARD_ID &&
					(c.entityId ?? c.trueEntityId) === CHAINBREAKER_HOGGER_ENTITY_ID,
			);
			expect(hoggerLinkedToEntity12).toBeDefined();

			ctx.cleanup();
		},
		300_000,
	);
});
