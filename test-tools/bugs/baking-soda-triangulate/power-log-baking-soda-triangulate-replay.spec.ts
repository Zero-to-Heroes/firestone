/**
 * Regression (Phase 1 — red test): After Triangulate discovers Baking Soda Volcano from deck,
 * the deck tracker must show exactly 3 Baking Soda Volcano in deck, not 4.
 *
 * Fixture: `test-tools/power.log` (last game), truncated after Triangulate SpawnToDeck +
 * SHUFFLE_DECK. Log client: Chmielinho (local 2); Triangulate caster SageSatyr (player 1).
 *
 * Run:
 *   export HS_REFERENCE_CARDS_JSON_PATH=https://raw.githubusercontent.com/Zero-to-Heroes/hs-reference-data/master/src/cards_short.json
 *   npx jest test-tools/bugs/baking-soda-triangulate/power-log-baking-soda-triangulate-replay.spec.ts --config=libs/game-state/jest.config.ts --runInBand
 */
import * as fs from 'fs';
import * as path from 'path';
import {
	replayPowerLogToGameState,
	requirePowerLogFixtureExists,
	requirePowerLogReplayPrerequisites,
	requirePowerLogReplayResult,
	resolveCardsJsonPath,
} from '../../lib/power-log-replay-harness';
import {
	assertTriangulateBakingSodaAnchorsFromPowerLogLines,
	countBakingSodaVolcanoDeckExposureAfterTriangulate,
	DRAWN_DECK_ENTITY,
	prepareBakingSodaTriangulateFixtureLines,
	SHUFFLED_COPY_ENTITY_IDS,
	TRIANGULATE_PLAYER_CONTROLLER,
	triangulateCasterDeckFromReplayState,
} from './baking-soda-triangulate-power-log-helpers';

const POWER_LOG_PATH = path.join(__dirname, '..', '..', 'power.log');

describe('Power log replay → Triangulate + Baking Soda Volcano deck count', () => {
	it('fixture: power.log last game through Triangulate SHUFFLE_DECK', () => {
		requirePowerLogFixtureExists(POWER_LOG_PATH);
		const lines = prepareBakingSodaTriangulateFixtureLines(fs.readFileSync(POWER_LOG_PATH, 'utf8'));
		assertTriangulateBakingSodaAnchorsFromPowerLogLines(lines);
	});

	it(
		'replays power.log; deck tracker shows 3 Baking Soda Volcano in deck (not 4), entity 22 not in deck',
		async () => {
			requirePowerLogFixtureExists(POWER_LOG_PATH);
			const cardsPath = resolveCardsJsonPath();
			requirePowerLogReplayPrerequisites(cardsPath, POWER_LOG_PATH);

			const replayLines = prepareBakingSodaTriangulateFixtureLines(fs.readFileSync(POWER_LOG_PATH, 'utf8'));

			const ctx = await replayPowerLogToGameState({
				logPath: POWER_LOG_PATH,
				logLinesOverride: replayLines,
				reviewId: 'baking-soda-triangulate-replay',
				settleMs: 90_000,
			});
			requirePowerLogReplayResult(ctx, cardsPath);

			expect(ctx.state.localPlayerId).not.toBe(TRIANGULATE_PLAYER_CONTROLLER);

			const casterDeck = triangulateCasterDeckFromReplayState(ctx.state);
			const bakingSodaExposure = countBakingSodaVolcanoDeckExposureAfterTriangulate(casterDeck);

			// Matches deck-zone UI after discover reveals TOY_500: 3 shuffled copies + source entity 22
			// still in deck (screenshot: 4× Baking Soda Volcano grouped in "In deck").
			expect(bakingSodaExposure).toBe(SHUFFLED_COPY_ENTITY_IDS.length);

			expect(casterDeck.deck.filter((c) => c.entityId === DRAWN_DECK_ENTITY)).toEqual([]);
			expect(casterDeck.hand.some((c) => c.entityId === DRAWN_DECK_ENTITY)).toBe(true);
		},
		180_000,
	);
});
