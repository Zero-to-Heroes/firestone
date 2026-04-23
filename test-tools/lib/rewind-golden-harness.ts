/**
 * Shared plumbing for the rewind non-regression test suite.
 *
 * Each log under {@link REWIND_LOGS_DIR} is replayed end-to-end through the parser and
 * GameStateService; the final GameState is stably stringified and compared to a committed
 * golden JSON. Run with `UPDATE_REWIND_GOLDENS=1` to (re)write the golden files instead of
 * asserting equality - useful for bootstrapping or after an intentional change to the
 * consumer-visible state shape.
 */
import * as fs from 'fs';
import * as path from 'path';
import {
	replayPowerLogToGameState,
	requirePowerLogReplayPrerequisites,
	requirePowerLogReplayResult,
	resolveCardsJsonPath,
} from './power-log-replay-harness';
import { stableStringifyGameState } from './stable-stringify';

export const REWIND_LOGS_DIR = path.join(__dirname, '..', 'non-reg', 'power-logs', 'rewind');
export const REWIND_GOLDENS_DIR = path.join(REWIND_LOGS_DIR, 'goldens');

export function isGoldenUpdateMode(): boolean {
	const v = process.env['UPDATE_REWIND_GOLDENS'];
	return v != null && v !== '' && v !== '0' && v.toLowerCase() !== 'false';
}

export function listRewindLogFiles(): readonly string[] {
	if (!fs.existsSync(REWIND_LOGS_DIR)) return [];
	return fs
		.readdirSync(REWIND_LOGS_DIR)
		.filter((f) => f.toLowerCase().endsWith('.log'))
		.sort();
}

export function goldenPathForLog(logFile: string): string {
	const base = path.basename(logFile, path.extname(logFile));
	return path.join(REWIND_GOLDENS_DIR, `${base}.state.json`);
}

export function ensureGoldensDir(): void {
	if (!fs.existsSync(REWIND_GOLDENS_DIR)) {
		fs.mkdirSync(REWIND_GOLDENS_DIR, { recursive: true });
	}
}

export interface RewindGoldenRunResult {
	readonly logFile: string;
	readonly logPath: string;
	readonly goldenPath: string;
	readonly serialized: string;
}

/**
 * Replay a rewind log and return its serialized final GameState plus path metadata.
 * Callers are responsible for asserting against the golden (or writing it in update mode).
 */
export async function runRewindReplay(logFile: string): Promise<RewindGoldenRunResult> {
	const logPath = path.join(REWIND_LOGS_DIR, logFile);
	const cardsPath = resolveCardsJsonPath();
	requirePowerLogReplayPrerequisites(cardsPath, logPath);

	const ctx = await replayPowerLogToGameState({
		logPath,
		reviewId: `rewind-nonreg-${path.basename(logFile, path.extname(logFile))}`,
		// Rewind logs are large (up to ~4MB, 9 rewinds). Give the event queue comfortable
		// headroom to drain before we snapshot the final state.
		settleMs: 20_000,
	});
	requirePowerLogReplayResult(ctx, cardsPath);

	const serialized = stableStringifyGameState(ctx.state);
	const goldenPath = goldenPathForLog(logFile);
	return { logFile, logPath, goldenPath, serialized };
}
