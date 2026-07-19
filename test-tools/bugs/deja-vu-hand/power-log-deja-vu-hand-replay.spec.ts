/**
 * Deja Vu: discover copies from opponent hand must not stamp cardIds onto those hand entities.
 * Knowledge should live in additionalKnownCardsInHand instead.
 *
 * Fixture: `deja-vu-hand.log` (from test-tools/power.log). Local player plays Deja Vu entity 28;
 * SETASIDE options copy opponent hand entities 38 / 42 / 57 (DS1_055 / CS2_124 / EX1_306).
 *
 * Run:
 *   export HS_REFERENCE_CARDS_JSON_PATH=https://raw.githubusercontent.com/Zero-to-Heroes/hs-reference-data/master/src/cards_short.json
 *   npx jest test-tools/bugs/deja-vu-hand/power-log-deja-vu-hand-replay.spec.ts --config=libs/game-state/jest.config.ts --runInBand
 */
import * as fs from 'fs';
import { trimPowerLogLinesToLastGame } from '../../lib/trim-power-log-last-game';
import {
	replayPowerLogToGameState,
	requirePowerLogFixtureExists,
	requirePowerLogReplayPrerequisites,
	requirePowerLogReplayResult,
	resolveCardsJsonPath,
	resolvePowerLogPathForSlug,
} from '../../lib/power-log-replay-harness';
import {
	assertDejaVuHandAnchorsFromPowerLogLines,
	DEJA_VU_OPPONENT_HAND_REVEALS,
} from './deja-vu-hand-power-log-helpers';

describe('Power log replay → Deja Vu opponent hand (additionalKnownCardsInHand)', () => {
	it('fixture contains Deja Vu play and three COPIED_FROM / LINKED_ENTITY hand reveals', () => {
		const logPath = resolvePowerLogPathForSlug('deja-vu-hand');
		requirePowerLogFixtureExists(logPath);
		const raw = fs.readFileSync(logPath, 'utf8');
		const logLines = trimPowerLogLinesToLastGame(raw.split(/\r?\n/));
		assertDejaVuHandAnchorsFromPowerLogLines(logLines);
	});

	it(
		'replays deja-vu-hand.log: revealed cards are in additionalKnownCardsInHand, not on source entities',
		async () => {
			const logPath = resolvePowerLogPathForSlug('deja-vu-hand');
			const cardsPath = resolveCardsJsonPath();
			requirePowerLogReplayPrerequisites(cardsPath, logPath);

			const ctx = await replayPowerLogToGameState({
				logPath,
				reviewId: 'deja-vu-hand-replay',
			});
			requirePowerLogReplayResult(ctx, cardsPath);

			try {
				const opponentHand = ctx.state.opponentDeck.hand;
				const knownInHand = ctx.state.opponentDeck.additionalKnownCardsInHand;

				for (const reveal of DEJA_VU_OPPONENT_HAND_REVEALS) {
					const source = opponentHand.find((c) => c.entityId === reveal.entityId);
					expect(source).toBeDefined();
					expect(source!.cardId).not.toBe(reveal.cardId);
					expect(knownInHand).toContain(reveal.cardId);
				}
			} finally {
				ctx.cleanup();
			}
		},
		180_000,
	);
});
