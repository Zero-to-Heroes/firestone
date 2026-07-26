/**
 * Full-pipeline performance harness (Overwolf-native path):
 *   power.log lines -> GameEvents (ProcessingQueue 500ms) -> ReplayParser -> GameEventsEmitterService
 *   -> GameStateService (ProcessingQueue 250ms) -> event parsers + secrets + stampMetaInfo -> deckEventBus
 *
 * Feeds the log TURN BY TURN and, for each turn, records:
 *  - wall-clock time split into "parser stage idle" and "game-state stage extra"
 *  - game-state CPU ms attributed via the FS_PERF_TRACE counters in GameStateService
 *    (per event type / per parser / secrets / stampMetaInfo)
 *  - GameEvents.dispatchGameEvent cumulative time delta
 *  - game events emitted + deckEventBus emissions (the Overwolf overlays consume this state
 *    directly, so emissions x state size is the rendering-pressure proxy)
 *  - state-size metrics (zone lengths, otherZone growth, parser entities) so growth can be
 *    correlated with per-turn cost
 * Optionally captures a V8 CPU profile over a turn window for flamegraph analysis.
 *
 * ### How to run
 *
 *   export HS_REFERENCE_CARDS_JSON_PATH=https://raw.githubusercontent.com/Zero-to-Heroes/hs-reference-data/master/src/cards_short.json
 *   export POWER_LOG_PERF_PATH=test-tools/bg.log          # defaults to test-tools/bg.log
 *   export FS_PERF_PROFILE_TURNS=25-35                    # optional CPU profile window (turn numbers)
 *   NODE_OPTIONS=--max-old-space-size=8192 npx jest test-tools/perf/full-pipeline-perf.spec.ts \
 *     --config=libs/game-state/jest.config.ts --runInBand
 *
 * The log stays untracked (142 MB bg.log). When neither POWER_LOG_PERF_PATH nor the default
 * log exists, the suite is skipped with a warning so the regular `nx test game-state` run
 * doesn't fail on machines/CI without the log. If POWER_LOG_PERF_PATH is explicitly set but
 * missing, the test fails (you asked for a perf run, it can't happen).
 *
 * Outputs:
 *  - per-turn table + top perf buckets on stdout
 *  - JSON results at test-tools/perf/full-pipeline-perf-results.json (gitignored)
 *  - optional CPU profile at test-tools/perf/full-pipeline-turns-<window>.cpuprofile (gitignored)
 */
import { TestBed } from '@angular/core/testing';
import { GameEventsEmitterService } from '@firestone/game-state';
import { trimPowerLogLinesToLastGame } from '@firestone/power-log-parser';
import * as fs from 'fs';
import * as inspector from 'inspector';
import * as path from 'path';
import {
	replayPowerLogToGameState,
	requirePowerLogReplayResult,
	resolveCardsJsonPath,
} from '../lib/power-log-replay-harness';

const DEFAULT_LOG_PATH = path.join(__dirname, '..', 'bg.log');
const ENV_LOG_PATH = process.env['POWER_LOG_PERF_PATH']?.trim();
const LOG_PATH = ENV_LOG_PATH?.length ? ENV_LOG_PATH : DEFAULT_LOG_PATH;
const LOG_AVAILABLE = fs.existsSync(LOG_PATH);
// Explicit env + missing file = fail loudly; no env + no default log = skip (CI machines
// don't carry the 142 MB bg.log).
const SHOULD_RUN = LOG_AVAILABLE || !!ENV_LOG_PATH?.length;
const describeMaybe = SHOULD_RUN ? describe : describe.skip;

if (!SHOULD_RUN) {
	console.warn(
		`[full-pipeline-perf] Skipping: no log at ${DEFAULT_LOG_PATH} and POWER_LOG_PERF_PATH not set. ` +
			'Set POWER_LOG_PERF_PATH to a power.log to run the perf harness.',
	);
}

/** Turn window (inclusive) to CPU-profile, e.g. "25-35". Empty/invalid = no profile. */
function resolveProfileWindow(): { start: number; end: number } | null {
	const raw = process.env['FS_PERF_PROFILE_TURNS']?.trim();
	if (!raw?.length) {
		return null;
	}
	const m = /^(\d+)\s*-\s*(\d+)$/.exec(raw);
	if (!m) {
		console.warn(`[full-pipeline-perf] Ignoring invalid FS_PERF_PROFILE_TURNS="${raw}" (expected e.g. 25-35)`);
		return null;
	}
	return { start: parseInt(m[1], 10), end: parseInt(m[2], 10) };
}

type TurnChunk = { readonly turn: number; readonly lines: readonly string[] };

/** Split log lines into chunks at each GameState-side `tag=TURN` change (chunk 0 = mulligan/setup). */
function splitIntoTurns(lines: readonly string[]): TurnChunk[] {
	const chunks: { turn: number; lines: string[] }[] = [{ turn: 0, lines: [] }];
	for (const line of lines) {
		if (line.includes('GameState') && line.includes('tag=TURN ')) {
			const m = /TAG_CHANGE Entity=GameEntity tag=TURN value=(\d+)/.exec(line);
			if (m) {
				chunks.push({ turn: parseInt(m[1], 10), lines: [] });
			}
		}
		chunks[chunks.length - 1].lines.push(line);
	}
	return chunks;
}

type PerfBuckets = { [bucket: string]: { totalMs: number; calls: number } };

function clonePerfStats(stats: PerfBuckets): PerfBuckets {
	const out: PerfBuckets = {};
	for (const key of Object.keys(stats)) {
		out[key] = { totalMs: stats[key].totalMs, calls: stats[key].calls };
	}
	return out;
}

function perfDeltaMs(before: PerfBuckets, after: PerfBuckets): { total: number; byBucket: PerfBuckets } {
	const byBucket: PerfBuckets = {};
	let total = 0;
	for (const key of Object.keys(after)) {
		const deltaMs = after[key].totalMs - (before[key]?.totalMs ?? 0);
		const deltaCalls = after[key].calls - (before[key]?.calls ?? 0);
		if (deltaCalls > 0 || deltaMs > 0) {
			byBucket[key] = { totalMs: deltaMs, calls: deltaCalls };
		}
		// The `event:` buckets fully contain the parser/secrets/stamp buckets, so only sum them
		// for the turn's total game-state CPU (avoids double counting).
		if (key.startsWith('event:')) {
			total += deltaMs;
		}
	}
	return { total, byBucket };
}

type ZoneSizes = { hand: number; board: number; deck: number; other: number };

type TurnMetrics = {
	turn: number;
	lines: number;
	events: number;
	emissions: number;
	wallMs: number;
	parserIdleMs: number;
	gsExtraMs: number;
	gsCpuMs: number;
	geDispatchMs: number;
	player: ZoneSizes;
	opponent: ZoneSizes;
	parserEntities: number;
	topBuckets: { bucket: string; totalMs: number; calls: number }[];
};

function zoneSizes(
	deck:
		| {
				hand?: readonly unknown[];
				board?: readonly unknown[];
				deck?: readonly unknown[];
				otherZone?: readonly unknown[];
		  }
		| null
		| undefined,
): ZoneSizes {
	return {
		hand: deck?.hand?.length ?? 0,
		board: deck?.board?.length ?? 0,
		deck: deck?.deck?.length ?? 0,
		other: deck?.otherZone?.length ?? 0,
	};
}

function postInspector<T>(session: inspector.Session, method: string, params?: object): Promise<T> {
	return new Promise((resolve, reject) => {
		(session as any).post(method, params, (err: Error | null, result: T) => (err ? reject(err) : resolve(result)));
	});
}

describeMaybe('Full pipeline perf (parser -> game-state -> emissions)', () => {
	// Must be set BEFORE GameStateService is constructed (it reads the env in its constructor).
	process.env['FS_PERF_TRACE'] = '1';

	it(
		'profiles bg.log turn by turn through GameEvents + GameStateService',
		async () => {
			if (!LOG_AVAILABLE) {
				throw new Error(`[full-pipeline-perf] POWER_LOG_PERF_PATH points to a missing file: ${LOG_PATH}`);
			}

			const cardsPath = resolveCardsJsonPath();
			const ctx = await replayPowerLogToGameState({
				logPath: LOG_PATH,
				feedLines: false,
			});
			requirePowerLogReplayResult(ctx, cardsPath);

			// The pipeline logs copiously (console.log/debug per event); silence the I/O so we
			// measure processing, not jest console formatting. NOTE: argument evaluation still
			// happens (representative of the real app, where the debug statements also run).
			const originalLog = console.log;
			const originalDebug = console.debug;
			console.log = () => undefined;
			console.debug = () => undefined;

			try {
				// Give GameStateService.init() (async, awaits mocked waitForReady) time to
				// subscribe to the emitter before the first lines are fed.
				await new Promise((r) => setTimeout(r, 500));

				const emitter = TestBed.inject(GameEventsEmitterService);
				let eventCount = 0;
				const eventsSub = emitter.allEvents.subscribe(() => eventCount++);
				let emissionCount = 0;
				const emissionsSub = ctx.gameStateService.deckEventBus.subscribe(() => emissionCount++);

				const rawLines = trimPowerLogLinesToLastGame(fs.readFileSync(LOG_PATH, 'utf8').split(/\r?\n/));
				// FS_PERF_WHOLE=1: feed the entire log as one chunk (mimics dev.service fakeGame's
				// bulk feed) instead of turn-by-turn. Wall clock then approximates the in-app
				// "time spent in total" without the per-turn queue-drain latency floors.
				const wholeMode = process.env['FS_PERF_WHOLE'] === '1';
				const turns = wholeMode ? [{ turn: 0, lines: rawLines }] : splitIntoTurns(rawLines);
				originalLog(
					`[full-pipeline-perf] ${rawLines.length} lines, ${turns.length} turn chunks from ${LOG_PATH}` +
						(wholeMode ? ' (whole-feed mode)' : ''),
				);

				const profileWindow = resolveProfileWindow();
				let profileSession: inspector.Session | null = null;
				let profileWritten: string | null = null;

				const results: TurnMetrics[] = [];
				const grandStart = Date.now();

				for (const chunk of turns) {
					if (profileWindow && !profileSession && chunk.turn >= profileWindow.start) {
						profileSession = new inspector.Session();
						profileSession.connect();
						await postInspector(profileSession, 'Profiler.enable');
						await postInspector(profileSession, 'Profiler.start');
						originalLog(`[full-pipeline-perf] CPU profile started at turn ${chunk.turn}`);
					}

					const perfBefore = clonePerfStats(ctx.gameStateService.getPerfStats());
					const eventsBefore = eventCount;
					const emissionsBefore = emissionCount;
					const dispatchBefore = ctx.gameEvents.totalTime;

					const t0 = Date.now();
					for (const line of chunk.lines) {
						if (line.length) {
							ctx.gameEvents.receiveLogLine(line);
						}
					}
					await ctx.gameEvents.awaitProcessingQueueIdle();
					const tParserIdle = Date.now();
					await ctx.gameStateService.awaitQueueIdle();
					const tGsIdle = Date.now();

					const perfAfter = clonePerfStats(ctx.gameStateService.getPerfStats());
					const delta = perfDeltaMs(perfBefore, perfAfter);
					const topBuckets = Object.entries(delta.byBucket)
						.sort((a, b) => b[1].totalMs - a[1].totalMs)
						.slice(0, 5)
						.map(([bucket, v]) => ({ bucket, totalMs: Math.round(v.totalMs * 10) / 10, calls: v.calls }));

					const state = ctx.gameStateService.state;
					const parserEntities = (() => {
						const entities = (state as any)?.parserState?.CurrentEntities;
						if (!entities) {
							return 0;
						}
						if (entities instanceof Map) {
							return entities.size;
						}
						return Array.isArray(entities) ? entities.length : Object.keys(entities).length;
					})();

					results.push({
						turn: chunk.turn,
						lines: chunk.lines.length,
						events: eventCount - eventsBefore,
						emissions: emissionCount - emissionsBefore,
						wallMs: tGsIdle - t0,
						parserIdleMs: tParserIdle - t0,
						gsExtraMs: tGsIdle - tParserIdle,
						gsCpuMs: Math.round(delta.total * 10) / 10,
						geDispatchMs: ctx.gameEvents.totalTime - dispatchBefore,
						player: zoneSizes(state?.playerDeck),
						opponent: zoneSizes(state?.opponentDeck),
						parserEntities,
						topBuckets,
					});

					if (profileWindow && profileSession && !profileWritten && chunk.turn >= profileWindow.end) {
						const { profile } = await postInspector<{ profile: unknown }>(profileSession, 'Profiler.stop');
						profileWritten = path.join(
							__dirname,
							`full-pipeline-turns-${profileWindow.start}-${profileWindow.end}.cpuprofile`,
						);
						fs.writeFileSync(profileWritten, JSON.stringify(profile));
						profileSession.disconnect();
						profileSession = null;
						originalLog(`[full-pipeline-perf] CPU profile written to ${profileWritten}`);
					}
				}

				// Window end past the last turn: flush whatever we captured.
				if (profileWindow && profileSession && !profileWritten) {
					const { profile } = await postInspector<{ profile: unknown }>(profileSession, 'Profiler.stop');
					profileWritten = path.join(
						__dirname,
						`full-pipeline-turns-${profileWindow.start}-${profileWindow.end}.cpuprofile`,
					);
					fs.writeFileSync(profileWritten, JSON.stringify(profile));
					profileSession.disconnect();
					profileSession = null;
					originalLog(`[full-pipeline-perf] CPU profile written to ${profileWritten}`);
				}

				const totalWallMs = Date.now() - grandStart;
				eventsSub.unsubscribe();
				emissionsSub.unsubscribe();

				// ---- Report ----
				const pad = (v: string | number, w: number) => String(v).padStart(w);
				originalLog('');
				originalLog(
					[
						pad('turn', 5),
						pad('lines', 8),
						pad('events', 7),
						pad('emit', 5),
						pad('wallMs', 8),
						pad('parseMs', 8),
						pad('gsWaitMs', 9),
						pad('gsCpuMs', 8),
						pad('dispMs', 7),
						pad('pOther', 7),
						pad('oOther', 7),
						pad('pBoard', 7),
						pad('entities', 9),
					].join(''),
				);
				for (const r of results) {
					originalLog(
						[
							pad(r.turn, 5),
							pad(r.lines, 8),
							pad(r.events, 7),
							pad(r.emissions, 5),
							pad(r.wallMs, 8),
							pad(r.parserIdleMs, 8),
							pad(r.gsExtraMs, 9),
							pad(r.gsCpuMs, 8),
							pad(r.geDispatchMs, 7),
							pad(r.player.other, 7),
							pad(r.opponent.other, 7),
							pad(r.player.board, 7),
							pad(r.parserEntities, 9),
						].join(''),
					);
				}
				originalLog(`TOTAL wall: ${totalWallMs} ms, events: ${eventCount}, emissions: ${emissionCount}`);

				const cumulative = ctx.gameStateService.getPerfStats();
				const top = Object.entries(cumulative)
					.sort((a, b) => b[1].totalMs - a[1].totalMs)
					.slice(0, 40);
				originalLog('');
				originalLog('Top cumulative game-state buckets:');
				for (const [bucket, v] of top) {
					originalLog(`  ${pad(Math.round(v.totalMs), 8)} ms ${pad(v.calls, 8)} calls  ${bucket}`);
				}

				const resultsPath = path.join(__dirname, 'full-pipeline-perf-results.json');
				fs.writeFileSync(
					resultsPath,
					JSON.stringify(
						{
							logPath: LOG_PATH,
							totalWallMs,
							totalEvents: eventCount,
							totalEmissions: emissionCount,
							cpuProfile: profileWritten,
							turns: results,
							cumulativeBuckets: cumulative,
						},
						null,
						'\t',
					),
				);
				originalLog(`[full-pipeline-perf] results written to ${resultsPath}`);

				expect(results.length).toBeGreaterThan(0);
			} finally {
				console.log = originalLog;
				console.debug = originalDebug;
				ctx.cleanup();
			}
		},
		4 * 60 * 60 * 1000,
	);
});
