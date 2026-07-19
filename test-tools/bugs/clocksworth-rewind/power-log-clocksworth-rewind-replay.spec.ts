/**
 * Regression: a Mister Clocksworth (TIME_038) Rewind must not resurrect minions that were
 * already dead before the rewind.
 *
 * Reporter: opponent's Vanessa the Ringleader (id=42) and Demolition Renovator (id=52) are
 * dead before the rewind starts, but when the app processes the `RESET_GAME` they come back
 * alive on the board.
 *
 * Fixture (`clocksworth-rewind.log`): single game, PWeasil (player 1, local) vs opponent
 * (player 2). During PWeasil's turn, Fyrakk generates Decimation (`CATA_581`, entity 245), a
 * board clear that kills the opponent's id=42 / id=52 (`ZONE=GRAVEYARD`,
 * `LAST_AFFECTED_BY=245`). The opponent then triggers Mister Clocksworth (`TIME_038`, id=236),
 * whose Rewind fires a `BlockType=GAME_RESET`. The authoritative `RESET_GAME` `FULL_ENTITY`
 * dump re-declares BOTH entities with `tag=ZONE value=GRAVEYARD` — i.e. they stay dead. The
 * fixture is truncated right after the second Rewind's PowerTaskList GAME_RESET block closes
 * (original power.log line 33953, `BLOCK_END` at 11:31:03), which keeps both back-to-back
 * Clocksworth rewinds while dropping the remainder of the game.
 *
 * Invariant: after replay, neither board may contain entity 42 or 52 (they are dead), and the
 * opponent's graveyard (`otherZone`) must contain them. Pre-fix the tracker resurrects them
 * onto the opponent board, so this test is red.
 *
 * Run:
 *   export HS_REFERENCE_CARDS_JSON_PATH=https://raw.githubusercontent.com/Zero-to-Heroes/hs-reference-data/master/src/cards_short.json
 *   npx jest test-tools/bugs/clocksworth-rewind/power-log-clocksworth-rewind-replay.spec.ts --config=libs/game-state/jest.config.ts --runInBand
 */
import * as fs from 'fs';
import {
	replayPowerLogToGameState,
	requirePowerLogReplayPrerequisites,
	requirePowerLogReplayResult,
	resolveCardsJsonPath,
	resolvePowerLogPathForSlug,
} from '../../lib/power-log-replay-harness';
import {
	getOpponentMinionsKilledByDecimationStillDeadAfterRewind,
	logShowsRewindGameReset,
} from './clocksworth-rewind-power-log-helpers';

describe('Power log replay → GameStateService (Clocksworth rewind / dead minions stay dead)', () => {
	it(
		'reporter log: minions killed before the rewind are not resurrected by RESET_GAME',
		async () => {
			const logPath = resolvePowerLogPathForSlug('clocksworth-rewind');
			const cardsPath = resolveCardsJsonPath();
			requirePowerLogReplayPrerequisites(cardsPath, logPath);

			// Ground the expected "must stay dead" set in the fixture's GAME_RESET dump.
			const lines = fs.readFileSync(logPath, 'utf8').split(/\r?\n/);
			expect(logShowsRewindGameReset(lines)).toBe(true);
			const deadEntityIds = getOpponentMinionsKilledByDecimationStillDeadAfterRewind(lines);
			expect(deadEntityIds).toEqual([42, 52]);

			const ctx = await replayPowerLogToGameState({
				logPath,
				reviewId: 'clocksworth-rewind-replay',
			});
			requirePowerLogReplayResult(ctx, cardsPath);

			const { state } = ctx;
			const boardEntityIds = [...state.playerDeck.board, ...state.opponentDeck.board].map((c) => c.entityId);

			// Primary invariant: dead minions must NOT be on any board after the rewind.
			const resurrected = deadEntityIds.filter((id) => boardEntityIds.includes(id));
			expect(resurrected).toEqual([]);

			// Clarifying invariant: they belong in the opponent's graveyard (otherZone). The
			// tracker stores dead minions with a negated entityId (so the graveyard copy can't
			// collide with a live entity), hence the abs() comparison.
			const opponentGraveyardIds = state.opponentDeck.otherZone.map((c) => Math.abs(c.entityId));
			for (const id of deadEntityIds) {
				expect(opponentGraveyardIds).toContain(id);
			}
		},
		300_000,
	);
});
