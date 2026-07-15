/**
 * Regression (Phase 1 — red test): Opponent plays hidden Hex; local player's Hex must remain in deck.
 *
 * Fixture: reqvam#2191 (player 1). Opponent entity 58 revealed as CORE_EX1_246 on play;
 * player entity 23 is a separate Hex still in deck.
 *
 * Run:
 *   export HS_REFERENCE_CARDS_JSON_PATH=https://raw.githubusercontent.com/Zero-to-Heroes/hs-reference-data/master/src/cards_short.json
 *   npx jest test-tools/bugs/hex-opposite-play/power-log-hex-opposite-play-replay.spec.ts --config=libs/game-state/jest.config.ts --runInBand
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
	assertHexOppositePlayAnchorsFromPowerLogLines,
	countHexInPlayerDeck,
	HEX_OPPOSITE_PLAY_POWER_LOG_PATH,
	HEX_OPPOSITE_PLAY_TRIMMED_LOG_PATH,
	PLAYER_DECKSTRING,
	prepareHexOppositePlayFixtureLines,
	truncateLogLinesAfterOpponentHexPlay,
	truncateLogLinesBeforeOpponentHexPlay,
} from './hex-opposite-play-power-log-helpers';

describe('Power log replay → Hex opposite-play deck tracker', () => {
	it('fixture: log contains opponent hidden Hex play and entity 58 in opponent deck at start', () => {
		const logPath = resolvePowerLogPathForSlug('hex-opposite-play');
		expect(logPath).toBe(HEX_OPPOSITE_PLAY_POWER_LOG_PATH);
		requirePowerLogFixtureExists(logPath);
		const lines = prepareHexOppositePlayFixtureLines(fs.readFileSync(logPath, 'utf8'));
		assertHexOppositePlayAnchorsFromPowerLogLines(lines);
	});

	it('fixture: trimmed log ends after opponent Hex resolves', () => {
		requirePowerLogFixtureExists(HEX_OPPOSITE_PLAY_TRIMMED_LOG_PATH);
		const trimmed = prepareHexOppositePlayFixtureLines(fs.readFileSync(HEX_OPPOSITE_PLAY_TRIMMED_LOG_PATH, 'utf8'));
		const full = prepareHexOppositePlayFixtureLines(
			fs.readFileSync(HEX_OPPOSITE_PLAY_POWER_LOG_PATH, 'utf8'),
		);
		expect(trimmed).toEqual(truncateLogLinesAfterOpponentHexPlay(full));
		expect(trimmed.length).toBeLessThan(full.length);
	});

	it(
		'replays trimmed log after opponent Hex; local deck must still contain 1 Hex',
		async () => {
			const logPath = HEX_OPPOSITE_PLAY_TRIMMED_LOG_PATH;
			const cardsPath = resolveCardsJsonPath();
			requirePowerLogReplayPrerequisites(cardsPath, HEX_OPPOSITE_PLAY_POWER_LOG_PATH);

			const fixtureLines = prepareHexOppositePlayFixtureLines(fs.readFileSync(logPath, 'utf8'));
			const ctx = await replayPowerLogToGameState({
				logPath: HEX_OPPOSITE_PLAY_POWER_LOG_PATH,
				logLinesOverride: fixtureLines,
				playerDeckstring: PLAYER_DECKSTRING,
				reviewId: 'hex-opposite-play-after-opponent-hex',
				settleMs: 90_000,
			});
			requirePowerLogReplayResult(ctx, cardsPath);

			expect(countHexInPlayerDeck(ctx.state.playerDeck)).toBe(1);

			ctx.cleanup();
		},
		300_000,
	);

	it(
		'replays log: opponent Hex play must not remove Hex from local deck',
		async () => {
			const logPath = resolvePowerLogPathForSlug('hex-opposite-play');
			const cardsPath = resolveCardsJsonPath();
			requirePowerLogReplayPrerequisites(cardsPath, logPath);

			const fixtureLines = prepareHexOppositePlayFixtureLines(fs.readFileSync(logPath, 'utf8'));
			const beforeLines = truncateLogLinesBeforeOpponentHexPlay(fixtureLines);
			const afterLines = truncateLogLinesAfterOpponentHexPlay(fixtureLines);

			const beforeCtx = await replayPowerLogToGameState({
				logPath,
				logLinesOverride: beforeLines,
				playerDeckstring: PLAYER_DECKSTRING,
				reviewId: 'hex-opposite-play-before-opponent-hex',
				settleMs: 90_000,
			});
			requirePowerLogReplayResult(beforeCtx, cardsPath);

			const afterCtx = await replayPowerLogToGameState({
				logPath,
				logLinesOverride: afterLines,
				playerDeckstring: PLAYER_DECKSTRING,
				reviewId: 'hex-opposite-play-after-opponent-hex-boundary',
				settleMs: 90_000,
			});
			requirePowerLogReplayResult(afterCtx, cardsPath);

			expect(countHexInPlayerDeck(beforeCtx.state.playerDeck)).toBeGreaterThanOrEqual(1);
			expect(countHexInPlayerDeck(afterCtx.state.playerDeck)).toBe(
				countHexInPlayerDeck(beforeCtx.state.playerDeck),
			);

			beforeCtx.cleanup();
			afterCtx.cleanup();
		},
		300_000,
	);
});
