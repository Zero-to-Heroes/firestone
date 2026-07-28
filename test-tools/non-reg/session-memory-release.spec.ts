/**
 * Session-memory release after Hearthstone exit (docs/electron-memory-investigation.md):
 * the parser state (replay tree, entities maps, tag histories) and the last GameState
 * used to stay resident until the next game. GameEvents now drops the TS parser and asks
 * GameStateService to reset itself (GAME_SESSION_RELEASED) after a grace period once the
 * game process exits.
 *
 * This spec replays a real power log, simulates the exit, and checks:
 *  1. before release: state has parserState entities and deck contents;
 *  2. after release: state is a fresh GameState (parser entities unpinned);
 *  3. the pipeline still works afterwards — the parser is lazily re-created and a
 *     second replay produces a populated state again.
 *
 * Run:
 *   export HS_REFERENCE_CARDS_JSON_PATH=https://raw.githubusercontent.com/Zero-to-Heroes/hs-reference-data/master/src/cards_short.json
 *   npx jest test-tools/non-reg/session-memory-release.spec.ts --config=libs/game-state/jest.config.ts --runInBand
 */
import { GameEvents } from '@firestone/game-state';
import * as fs from 'fs';
import {
	replayPowerLogToGameState,
	requirePowerLogReplayPrerequisites,
	resolveCardsJsonPath,
	resolvePowerLogPathForSlug,
} from '../lib/power-log-replay-harness';
import { trimPowerLogLinesToLastGame } from '../lib/trim-power-log-last-game';

const waitUntil = async (predicate: () => boolean, timeoutMs = 20_000): Promise<boolean> => {
	const start = Date.now();
	while (!predicate()) {
		if (Date.now() - start > timeoutMs) {
			return false;
		}
		await new Promise((r) => setTimeout(r, 100));
	}
	return true;
};

describe('Session-memory release after Hearthstone exit', () => {
	it('clears parser + game state on exit, and a later game still parses', async () => {
		const logPath = resolvePowerLogPathForSlug('blood-clone');
		const cardsPath = resolveCardsJsonPath();
		requirePowerLogReplayPrerequisites(cardsPath, logPath);

		GameEvents.sessionReleaseGraceMs = 200;
		const ctx = await replayPowerLogToGameState({
			logPath,
			reviewId: 'session-memory-release',
		});

		// 1. Populated state before the release (hand is empty at game end, so count
		// cards across all zones)
		const deckSize = (state: typeof ctx.gameStateService.state) =>
			[state.playerDeck, state.opponentDeck]
				.flatMap((deck) => [deck?.hand, deck?.deck, deck?.board, deck?.otherZone])
				.reduce((total, zone) => total + (zone?.length ?? 0), 0);
		const before = ctx.gameStateService.state;
		expect(before.parserState?.CurrentEntities?.size ?? 0).toBeGreaterThan(0);
		expect(deckSize(before)).toBeGreaterThan(0);

		// 2. Exit → grace period → released
		ctx.triggerGameExit();
		const released = await waitUntil(
			() => (ctx.gameStateService.state.parserState?.CurrentEntities?.size ?? 0) === 0,
		);
		expect(released).toBe(true);
		const after = ctx.gameStateService.state;
		expect(after.parserState).toBeUndefined();
		expect(deckSize(after)).toBe(0);
		expect(ctx.gameStateService.deckEventBus.value?.parserState).toBeUndefined();

		// 3. The parser is re-created lazily: feeding the same game again repopulates the state
		const lines = trimPowerLogLinesToLastGame(fs.readFileSync(logPath, 'utf8').split(/\r?\n/));
		for (const line of lines) {
			if (line.length) {
				ctx.gameEvents.receiveLogLine(line);
			}
		}
		const repopulated = await waitUntil(
			() => (ctx.gameStateService.state.parserState?.CurrentEntities?.size ?? 0) > 0,
			120_000,
		);
		expect(repopulated).toBe(true);

		ctx.cleanup();
	}, 300_000);
});
