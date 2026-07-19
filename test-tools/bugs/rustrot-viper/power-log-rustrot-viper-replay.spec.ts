/**
 * Regression: opponent's Rustrot Viper (CORE_SW_072, entity 21) still appears in
 * `opponentDeck.deck` after being traded back, re-drawn, and played.
 *
 * Fixture (`rustrot-viper.log`, ~17k lines, single game):
 *  - Opponent draws Rustrot Viper T1, trades it (DECK_ACTION) back into deck.
 *  - Re-drawn T6, played from hand (destroys Wicked Knife), later dies.
 *
 * Bug invariant: `opponentDeck.deck` must contain zero Rustrot Viper entries at
 * end of replay. Pre-fix the fixture leaves a phantom CORE_SW_072 deck row.
 *
 * Run:
 *   export HS_REFERENCE_CARDS_JSON_PATH=https://raw.githubusercontent.com/Zero-to-Heroes/hs-reference-data/master/src/cards_short.json
 *   npx jest test-tools/bugs/rustrot-viper/power-log-rustrot-viper-replay.spec.ts --config=libs/game-state/jest.config.ts --runInBand
 */
import * as fs from 'fs';
import { CardIds } from '@firestone-hs/reference-data';
import {
	replayPowerLogToGameState,
	requirePowerLogFixtureExists,
	requirePowerLogReplayPrerequisites,
	requirePowerLogReplayResult,
	resolveCardsJsonPath,
	resolvePowerLogPathForSlug,
} from '../../lib/power-log-replay-harness';
import {
	parseRustrotViperFixtureMarkers,
	RUSTROT_VIPER_ENTITY_ID,
	RUSTROT_VIPER_POWER_LOG_PATH,
} from './rustrot-viper-power-log-helpers';

describe('Power log replay → GameStateService (Rustrot Viper must not remain in opponent deck after play)', () => {
	it('fixture: rustrot-viper.log contains trade, play, and graveyard markers for entity 21', () => {
		const logPath = resolvePowerLogPathForSlug('rustrot-viper');
		expect(logPath).toBe(RUSTROT_VIPER_POWER_LOG_PATH);
		requirePowerLogFixtureExists(logPath);
		const raw = fs.readFileSync(logPath, 'utf8');
		const lines = raw.split(/\r?\n/).filter((line) => line.length > 0);
		expect(lines.some((line) => line.includes('CREATE_GAME'))).toBe(true);

		const markers = parseRustrotViperFixtureMarkers(lines);
		expect(markers.viperEntityId).toBe(RUSTROT_VIPER_ENTITY_ID);
		expect(markers.viperCardId).toBe(CardIds.RustrotViperCore);
		expect(markers.tradeRevealLineIndex).toBeGreaterThan(0);
		expect(markers.playFromHandLineIndex).toBeGreaterThan(markers.tradeRevealLineIndex);
		expect(markers.graveyardLineIndex).toBeGreaterThan(markers.playFromHandLineIndex);
	});

	it(
		'reporter log: opponentDeck.deck contains no Rustrot Viper entry at end of replay',
		async () => {
			const logPath = resolvePowerLogPathForSlug('rustrot-viper');
			const cardsPath = resolveCardsJsonPath();
			requirePowerLogReplayPrerequisites(cardsPath, logPath);

			const ctx = await replayPowerLogToGameState({
				logPath,
				reviewId: 'rustrot-viper-replay',
			});
			requirePowerLogReplayResult(ctx, cardsPath);

			const phantomVipers = ctx.state.opponentDeck.deck.filter(
				(c) => c.cardId === CardIds.RustrotViperCore || c.entityId === RUSTROT_VIPER_ENTITY_ID,
			);
			expect(phantomVipers).toEqual([]);

			ctx.cleanup();
		},
		300_000,
	);
});
