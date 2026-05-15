/**
 * Regression: Mimicry (EDR_522) — both cards the spell mirrors into the **opponent’s** hand (player 1 in this log)
 * must be revealed to the caster (local player 2; they see P1 in `opponentDeck`).
 *
 * Fixture: extracted from support `71738f3b-16cc-48a0-b0b7-ce65d9c524f4.power.zip` — last game from GameState
 * `CREATE_GAME` (~source line 826529) through PowerTaskList after Mimicry (`EndCurrentTaskList` 314, ~source line 838353).
 * Player 2 casts Mimicry; PowerTaskList moves P1 deck entities **16** and **7** into P1’s hand (mirrored by copies 113/114 on P2).
 * See `mimicry-second-hand-power-log-helpers.ts`.
 *
 * Run:
 *   export HS_REFERENCE_CARDS_JSON_PATH=https://raw.githubusercontent.com/Zero-to-Heroes/hs-reference-data/master/src/cards_short.json
 *   npx jest test-tools/bugs/mimicry-second-hand/power-log-mimicry-second-hand-replay.spec.ts --config=libs/game-state/jest.config.ts --runInBand
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
	assertMimicryFixtureContainsExpectedShowEntities,
	MIMICRY_EXPECTED_OPPONENT_VICTIM_HAND_SLOTS,
} from './mimicry-second-hand-power-log-helpers';

describe('Power log replay → GameStateService (Mimicry opponent hand, both slots)', () => {
	it('fixture still contains the documented Mimicry TAG_CHANGE DECK→HAND lines for player 1', () => {
		const logPath = resolvePowerLogPathForSlug('mimicry-second-hand');
		requirePowerLogFixtureExists(logPath);
		const raw = fs.readFileSync(logPath, 'utf8');
		assertMimicryFixtureContainsExpectedShowEntities(raw);
	});

	it(
		'replays mimicry-second-hand.log: opponent (P1) hand entities 16 and 7 must show Gelbin + Mekkatorque Aura',
		async () => {
			const logPath = resolvePowerLogPathForSlug('mimicry-second-hand');
			const cardsPath = resolveCardsJsonPath();
			requirePowerLogReplayPrerequisites(cardsPath, logPath);

			const raw = fs.readFileSync(logPath, 'utf8');
			const logLines = trimPowerLogLinesToLastGame(raw.split(/\r?\n/));

			const ctx = await replayPowerLogToGameState({
				logPath,
				logLinesOverride: logLines,
				reviewId: 'mimicry-second-hand-replay',
				settleMs: 20_000,
			});
			requirePowerLogReplayResult(ctx, cardsPath);

			const hand = ctx.state.opponentDeck.hand;
			for (const slot of MIMICRY_EXPECTED_OPPONENT_VICTIM_HAND_SLOTS) {
				const row = hand.find((c) => c.entityId === slot.entityId);
				expect(row).toBeDefined();
				expect(row!.cardId).toBe(slot.cardId);
			}
		},
		180_000,
	);
});
