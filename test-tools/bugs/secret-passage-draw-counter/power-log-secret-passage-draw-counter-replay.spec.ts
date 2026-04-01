/**
 * Regression (red/green): Secret Passage deck→hand must not add to `cardsDrawnByTurn` (Everything Must Go! / "drawn this turn").
 *
 * Fixture: `secret-passage-draw-counter.log` — last game only; includes SCH_305. Ground truth: after a
 * full replay, player turn `4` must show **6** draws with the fix; **10** without (four spurious
 * counts from Secret Passage).
 *
 * Run:
 *   HS_REFERENCE_CARDS_JSON_PATH=/path/to/cards_short.json npx jest test-tools/bugs/secret-passage-draw-counter/power-log-secret-passage-draw-counter-replay.spec.ts --config=libs/game-state/jest.config.ts --runInBand
 */
import * as fs from 'fs';
import { CardIds } from '@firestone-hs/reference-data';
import {
	replayPowerLogToGameState,
	requirePowerLogReplayPrerequisites,
	requirePowerLogReplayResult,
	resolveCardsJsonPath,
	resolvePowerLogPathForSlug,
} from '../../lib/power-log-replay-harness';

/** Firestone `currentTurn` (see NewTurnParser numeric turn), not raw GameEntity TURN tag. */
const PLAYER_TURN_WITH_SECRET_PASSAGE = 4;

/** Expected `cardsDrawnByTurn` for that turn once SCH_305 swaps are excluded (fixture-specific). */
const EXPECTED_CARDS_DRAWN_PLAYER_TURN_WITH_SP = 6;

describe('Power log replay → GameStateService (Secret Passage vs cardsDrawnByTurn)', () => {
	it(
		'player cardsDrawnByTurn for the Secret Passage turn matches in-game draw count (excludes SCH_305 swaps)',
		async () => {
			const logPath = resolvePowerLogPathForSlug('secret-passage-draw-counter');
			const cardsPath = resolveCardsJsonPath();
			requirePowerLogReplayPrerequisites(cardsPath, logPath);
			const ctx = await replayPowerLogToGameState({
				logPath,
				reviewId: 'secret-passage-draw-counter-replay',
			});
			requirePowerLogReplayResult(ctx, cardsPath);
			const raw = fs.readFileSync(logPath, 'utf8');
			expect(raw).toContain(CardIds.SecretPassage);

			const entry = ctx.state.playerDeck.cardsDrawnByTurn.find(
				(t) => t.turn === PLAYER_TURN_WITH_SECRET_PASSAGE,
			);
			expect(entry?.value).toBe(EXPECTED_CARDS_DRAWN_PLAYER_TURN_WITH_SP);
		},
		600_000,
	);
});
