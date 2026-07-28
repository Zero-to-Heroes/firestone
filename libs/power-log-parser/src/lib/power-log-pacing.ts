/**
 * Timestamp-based pacing for power.log replays.
 *
 * Fake-game drivers (Overwolf `window.fakeGame`, the Electron `FS_FAKE_GAME_LOG` driver)
 * historically fed log lines as fast as possible, which does not reproduce live-game
 * behavior: batching windows, per-turn IPC broadcast cadence, sim scheduling and stall
 * patterns all depend on the real arrival rate. These helpers turn the `D HH:MM:SS.fffffff`
 * line prefixes into a feed schedule so a replay progresses at the same pace as the
 * original game (optionally sped up, with long idle gaps capped).
 */

const LINE_TIMESTAMP_REGEX = /^[A-Z] (\d{1,2}):(\d{2}):(\d{2})\.(\d+)/;

/**
 * Milliseconds since midnight encoded in a power.log line prefix (`D 12:54:05.6164833 ...`),
 * or null when the line has no timestamp (wrapped/continuation lines).
 */
export function parsePowerLogLineTimestampMs(line: string): number | null {
	const match = LINE_TIMESTAMP_REGEX.exec(line);
	if (!match) {
		return null;
	}
	const hours = parseInt(match[1]!, 10);
	const minutes = parseInt(match[2]!, 10);
	const seconds = parseInt(match[3]!, 10);
	// Fraction is 7 digits (100ns ticks); only the first 3 matter for pacing
	const millis = parseInt(match[4]!.slice(0, 3).padEnd(3, '0'), 10);
	return ((hours * 60 + minutes) * 60 + seconds) * 1000 + millis;
}

export interface PowerLogPacingOptions {
	/**
	 * Playback speed multiplier: 1 = real time, 2 = twice as fast. Must be > 0
	 * (use no schedule at all for "as fast as possible").
	 */
	readonly speed?: number;
	/**
	 * Cap on a single idle gap between consecutive log lines, in real-time ms (applied
	 * before the speed division). Long pauses (opponent thinking, player AFK between
	 * matches) carry no replay fidelity beyond a few seconds of pipeline idleness.
	 * Default 15000. Pass Infinity to reproduce gaps faithfully.
	 */
	readonly maxGapMs?: number;
}

/**
 * Cumulative feed offsets (ms from replay start) for each line, derived from the log
 * timestamps. Lines without a timestamp (continuations) share the previous line's offset.
 * Midnight rollover between consecutive lines is handled; anomalous backwards jumps
 * count as zero gap.
 */
export function computePowerLogFeedOffsetsMs(lines: readonly string[], options?: PowerLogPacingOptions): number[] {
	const speed = options?.speed ?? 1;
	if (!(speed > 0)) {
		throw new Error(`[power-log-pacing] speed must be > 0, got ${speed}`);
	}
	const maxGapMs = options?.maxGapMs ?? 15_000;
	const DAY_MS = 24 * 60 * 60 * 1000;
	const offsets: number[] = new Array(lines.length);
	let elapsedMs = 0;
	let previousTs: number | null = null;
	for (let i = 0; i < lines.length; i++) {
		const ts = parsePowerLogLineTimestampMs(lines[i]!);
		if (ts != null && previousTs != null) {
			let gap = ts - previousTs;
			if (gap < -DAY_MS / 2) {
				// Midnight rollover
				gap += DAY_MS;
			}
			if (gap > 0) {
				elapsedMs += Math.min(gap, maxGapMs);
			}
		}
		if (ts != null) {
			previousTs = ts;
		}
		offsets[i] = elapsedMs / speed;
	}
	return offsets;
}

/**
 * Max lines fed synchronously before yielding a macrotask, so a burst of lines all due at
 * once (match-start dumps, or speed = "as fast as possible") cannot starve the event loop
 * that the consuming processing queues run on.
 */
const MAX_SYNC_FEED_BATCH = 2000;

/**
 * Feed `lines` to `feed` following the log's own timing (see {@link computePowerLogFeedOffsetsMs}).
 * Lines that are already due are fed synchronously in a batch (capped, see
 * {@link MAX_SYNC_FEED_BATCH}); the loop then sleeps until the next line's offset.
 * Returns the total wall-clock feeding time in ms.
 */
export async function feedPowerLogLinesPaced(
	lines: readonly string[],
	feed: (line: string) => void,
	options?: PowerLogPacingOptions & {
		/** Called after each batch of due lines, for progress reporting. */
		readonly onProgress?: (fedLines: number, totalLines: number, elapsedMs: number) => void;
	},
): Promise<number> {
	const offsets = computePowerLogFeedOffsetsMs(lines, options);
	const start = Date.now();
	let i = 0;
	while (i < lines.length) {
		const now = Date.now() - start;
		const batchStart = i;
		while (i < lines.length && offsets[i]! <= now && i - batchStart < MAX_SYNC_FEED_BATCH) {
			feed(lines[i]!);
			i++;
		}
		if (i > batchStart) {
			options?.onProgress?.(i, lines.length, Date.now() - start);
		}
		if (i < lines.length) {
			const waitMs = offsets[i]! - (Date.now() - start);
			await new Promise((resolve) => setTimeout(resolve, Math.max(0, waitMs)));
		}
	}
	return Date.now() - start;
}
