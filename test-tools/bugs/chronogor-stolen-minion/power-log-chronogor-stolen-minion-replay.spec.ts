/**
 * Regression (Phase 1 — red test): Opponent steals Concealing Confection from local deck via Chronogor,
 * then plays it. Local deck must no longer contain JAIL_460 after play (removal only at play, not steal/draw).
 *
 * Fixture: `chronogor-stolen-minion.log` (single game). Local player Chmielinho (player 1).
 *
 * Run:
 *   export HS_REFERENCE_CARDS_JSON_PATH=https://raw.githubusercontent.com/Zero-to-Heroes/hs-reference-data/master/src/cards_short.json
 *   npx jest test-tools/bugs/chronogor-stolen-minion/power-log-chronogor-stolen-minion-replay.spec.ts --config=libs/game-state/jest.config.ts --runInBand
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
	assertChronogorStolenMinionAnchorsFromPowerLogLines,
	CHRONOGOR_STOLEN_MINION_POWER_LOG_PATH,
	PLAYER_DECKSTRING,
	prepareChronogorStolenMinionFixtureLines,
	STOLEN_CARD_ID,
	STOLEN_ENTITY_ID,
} from './chronogor-stolen-minion-power-log-helpers';

describe('Power log replay → Chronogor stolen Concealing Confection removed from local deck on opponent play', () => {
	it('fixture: single-game log contains Chronogor steal and opponent play of entity 32 as JAIL_460', () => {
		const logPath = resolvePowerLogPathForSlug('chronogor-stolen-minion');
		expect(logPath).toBe(CHRONOGOR_STOLEN_MINION_POWER_LOG_PATH);
		requirePowerLogFixtureExists(logPath);
		const lines = prepareChronogorStolenMinionFixtureLines(fs.readFileSync(logPath, 'utf8'));
		assertChronogorStolenMinionAnchorsFromPowerLogLines(lines);
	});

	it(
		'replays log; after opponent plays stolen Concealing Confection, JAIL_460 is not in local deck',
		async () => {
			const logPath = resolvePowerLogPathForSlug('chronogor-stolen-minion');
			const cardsPath = resolveCardsJsonPath();
			requirePowerLogReplayPrerequisites(cardsPath, logPath);

			const ctx = await replayPowerLogToGameState({
				logPath,
				playerDeckstring: PLAYER_DECKSTRING,
				reviewId: 'chronogor-stolen-minion-replay',
			});
			requirePowerLogReplayResult(ctx, cardsPath);

			const confectionInDeck = ctx.state.playerDeck.deck.filter((c) => c.cardId === STOLEN_CARD_ID);
			expect(confectionInDeck.length).toBe(0);
			expect(
				confectionInDeck.some((c) => (c.entityId ?? c.trueEntityId) === STOLEN_ENTITY_ID),
			).toBe(false);

			ctx.cleanup();
		},
		300_000,
	);
});
