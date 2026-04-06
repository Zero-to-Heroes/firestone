/**
 * Integration (power.log only): expected hand size comes from the last {@link GameState.DebugPrintOptions}
 * block in the fixture ({@link extractLocalPlayerHandCountFromLastDebugPrintOptions}), using the local
 * player's `PlayerID` from {@link extractLocalPlayerIdFromFirstDebugPrintGame} (not always `1`). Replay
 * must satisfy {@link getDeckTrackerEffectiveHandSize} === that value (deck tracker contract).
 *
 * `dh-hand-size-zugars-reporter-truncated.log` — trimmed from premium export
 * https://power.firestoneapp.com/premium/22c67e33-ba74-48be-8fcb-5c62292e7d9e.power.zip (ends after last
 * `DebugPrintOptions` id=95 where the log shows 10 cards in hand; overlay showed 9 — regression should fail
 * until the deck-state / merge bug is fixed).
 *
 * Run:
 *   export HS_REFERENCE_CARDS_JSON_PATH=https://raw.githubusercontent.com/Zero-to-Heroes/hs-reference-data/master/src/cards_short.json
 *   npx jest test-tools/bugs/dh-hand-size/power-log-dh-hand-size-replay.spec.ts --config=libs/game-state/jest.config.ts --runInBand
 */
import * as fs from 'fs';
import * as path from 'path';
import { getDeckTrackerEffectiveHandSize, mergeHandCardsForDeckTrackerDisplay } from '@firestone/game-state';
import { trimPowerLogLinesToLastGame } from '../../lib/trim-power-log-last-game';
import {
	replayPowerLogToGameState,
	requirePowerLogFixtureExists,
	requirePowerLogReplayPrerequisites,
	requirePowerLogReplayResult,
	resolveCardsJsonPath,
} from '../../lib/power-log-replay-harness';
import {
	extractLocalPlayerHandCountFromLastDebugPrintOptions,
	extractLocalPlayerIdFromFirstDebugPrintGame,
} from './dh-hand-size-power-log-helpers';

describe('Power log replay → GameStateService (DH hand count vs power.log)', () => {
	/** Same source as dh-hand-size.log (reporter zip), last game only; ends right after GameState.DebugPrintOptions where player 1 has 10 cards in hand. */
	const truncatedLogPath = path.join(__dirname, 'dh-hand-size-hand-count-at-10.log');

	it(
		'truncated power.log: log-derived hand count matches replay effective deck-tracker hand size',
		async () => {
			const cardsPath = resolveCardsJsonPath();
			requirePowerLogReplayPrerequisites(cardsPath, truncatedLogPath);

			const raw = fs.readFileSync(truncatedLogPath, 'utf8');
			const logLines = raw.split(/\r?\n/);
			const localPlayerId = extractLocalPlayerIdFromFirstDebugPrintGame(logLines);
			const expectedHandCount = extractLocalPlayerHandCountFromLastDebugPrintOptions(
				logLines,
				localPlayerId,
			);

			const ctx = await replayPowerLogToGameState({
				logPath: truncatedLogPath,
				reviewId: 'dh-hand-size-hand-count-at-10',
				settleMs: 12_000,
			});
			requirePowerLogReplayResult(ctx, cardsPath);

			const deck = ctx.state.playerDeck;
			const mergedLen = mergeHandCardsForDeckTrackerDisplay(
				deck.hand,
				deck.additionalKnownCardsInHand,
				ctx.allCardsRef,
			).length;
			const effective = getDeckTrackerEffectiveHandSize(deck, ctx.allCardsRef);
			// Ground truth from log; merged deck-tracker list should match Hearthstone
			expect(mergedLen).toBe(expectedHandCount);
			// Deck tracker API: effective size must match merged list (revert getDeckTrackerEffectiveHandSize to hand.length → RED when they differ)
			expect(effective).toBe(mergedLen);
		},
		180_000,
	);

	/** Full single-game export from support zip; local player is PlayerID=2 (Zugars). */
	const zugarsReporterLogPath = path.join(__dirname, 'dh-hand-size-zugars-reporter-truncated.log');

	it(
		'Zugars reporter power.log: log-derived hand count matches replay effective deck-tracker hand size',
		async () => {
			const cardsPath = resolveCardsJsonPath();
			requirePowerLogReplayPrerequisites(cardsPath, zugarsReporterLogPath);

			const raw = fs.readFileSync(zugarsReporterLogPath, 'utf8');
			const logLines = raw.split(/\r?\n/);
			const localPlayerId = extractLocalPlayerIdFromFirstDebugPrintGame(logLines);
			expect(localPlayerId).toBe(2);

			const expectedHandCount = extractLocalPlayerHandCountFromLastDebugPrintOptions(
				logLines,
				localPlayerId,
			);
			expect(expectedHandCount).toBe(10);

			const ctx = await replayPowerLogToGameState({
				logPath: zugarsReporterLogPath,
				reviewId: 'dh-hand-size-zugars-reporter',
				settleMs: 12_000,
			});
			requirePowerLogReplayResult(ctx, cardsPath);

			const deck = ctx.state.playerDeck;
			const mergedLen = mergeHandCardsForDeckTrackerDisplay(
				deck.hand,
				deck.additionalKnownCardsInHand,
				ctx.allCardsRef,
			).length;
			const effective = getDeckTrackerEffectiveHandSize(deck, ctx.allCardsRef);
			expect(mergedLen).toBe(expectedHandCount);
			expect(effective).toBe(mergedLen);
		},
		300_000,
	);

	it('dh-hand-size.log is a last-game slice starting at CREATE_GAME', () => {
		const fullPath = path.join(__dirname, 'dh-hand-size.log');
		requirePowerLogFixtureExists(fullPath);
		const raw = fs.readFileSync(fullPath, 'utf8');
		const lines = trimPowerLogLinesToLastGame(raw.split(/\r?\n/));
		expect(lines[0]).toContain('CREATE_GAME');
	});
});
