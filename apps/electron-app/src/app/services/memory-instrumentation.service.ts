/**
 * Plan A memory / stall instrumentation for the Electron main process.
 * See docs/electron-memory-investigation.md.
 *
 * Enabled only when FS_ELECTRON_MEM=1. Samples process/window/heap metrics on an
 * interval (FS_ELECTRON_MEM_INTERVAL seconds, default 15) and runs a 250ms
 * main-thread stall detector. Everything is written as JSONL to
 * userData/logs/memory-YYYY-MM-DD-HH-MM-SS.jsonl; stall events are mirrored to the
 * main log via console.log('[fs-mem-stall] ...') for time-correlation.
 */
import { Injector } from '@angular/core';
import { GameEvent, GameEventsEmitterService, GameStateService } from '@firestone/game-state';
import { PowerLogBufferService } from '@firestone/shared/common/service';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { app, BrowserWindow, webContents } from 'electron';
import { existsSync, mkdirSync } from 'fs';
import { appendFile, writeFile } from 'fs/promises';
import { Session } from 'inspector';
import { join } from 'path';
import * as v8 from 'v8';

const STALL_DETECTOR_TICK_MS = 250;
const STALL_LOG_THRESHOLD_MS = 500;
const DEFAULT_SAMPLE_INTERVAL_S = 15;
const SLOW_OP_THRESHOLD_MS = 100;
const CPU_PROFILE_CHUNK_S = 120;

let sampleTimer: NodeJS.Timeout | null = null;
let stallTimer: NodeJS.Timeout | null = null;
let turnStartUnsubscribe: (() => void) | null = null;
let writeChain: Promise<void> = Promise.resolve();
let outputFilePath: string | null = null;
let profilerSession: Session | null = null;
let profilerChunkTimer: NodeJS.Timeout | null = null;
let profilerChunkIndex = 0;
let profilerBasePath: string | null = null;

export const isMemoryInstrumentationEnabled = (): boolean => process.env['FS_ELECTRON_MEM'] === '1';

export const startMemoryInstrumentation = (injector: Injector): void => {
	if (!isMemoryInstrumentationEnabled()) {
		return;
	}

	const logsDir = join(app.getPath('userData'), 'logs');
	if (!existsSync(logsDir)) {
		mkdirSync(logsDir, { recursive: true });
	}
	const now = new Date();
	const date = now.toISOString().split('T')[0];
	const time = now.toTimeString().split(' ')[0].replace(/:/g, '-');
	outputFilePath = join(logsDir, `memory-${date}-${time}.jsonl`);

	const intervalS = parseInt(process.env['FS_ELECTRON_MEM_INTERVAL'] ?? '', 10) || DEFAULT_SAMPLE_INTERVAL_S;
	console.log('[fs-mem] instrumentation enabled', `interval=${intervalS}s`, `output=${outputFilePath}`);

	writeRecord({
		kind: 'meta',
		pid: process.pid,
		appVersion: app.getVersion(),
		electronVersion: process.versions.electron,
		sampleIntervalS: intervalS,
	});

	// Main-thread stall detector: any drift beyond the timer period is time the main
	// thread spent blocked (the direct cause of "Not responding").
	let lastTick = Date.now();
	let maxStallSinceTurnStart = 0;
	let maxStallSinceSample = 0;
	stallTimer = setInterval(() => {
		const tickNow = Date.now();
		const stallMs = tickNow - lastTick - STALL_DETECTOR_TICK_MS;
		lastTick = tickNow;
		if (stallMs > maxStallSinceTurnStart) {
			maxStallSinceTurnStart = stallMs;
		}
		if (stallMs > maxStallSinceSample) {
			maxStallSinceSample = stallMs;
		}
		if (stallMs > STALL_LOG_THRESHOLD_MS) {
			const turn = getCurrentTurn(injector);
			console.log('[fs-mem-stall]', `main thread blocked ~${stallMs}ms`, `turn=${turn ?? 'n/a'}`);
			writeRecord({ kind: 'stall', stallMs, turn });
		}
	}, STALL_DETECTOR_TICK_MS);

	// Longest stall per turn, logged at the start of the next turn. Also drives the
	// opt-in heap snapshots (below).
	const heapSnapshotTurns = parseHeapSnapshotTurns();
	try {
		const emitter = injector.get(GameEventsEmitterService);
		const sub = emitter.allEvents.subscribe((event: GameEvent) => {
			if (heapSnapshotTurns && event?.type === GameEvent.GAME_END) {
				writeHeapSnapshot(logsDir, `${date}-${time}`, 'game-end');
				return;
			}
			if (event?.type !== GameEvent.TURN_START) {
				return;
			}
			const turn = getCurrentTurn(injector);
			console.log(
				'[fs-mem-stall]',
				`longest main-thread stall during previous turn: ${maxStallSinceTurnStart}ms`,
				`newTurn=${turn ?? 'n/a'}`,
			);
			writeRecord({ kind: 'turn-stall', maxStallMs: maxStallSinceTurnStart, newTurn: turn });
			maxStallSinceTurnStart = 0;
			if (heapSnapshotTurns && turn != null && heapSnapshotTurns.has(turn)) {
				heapSnapshotTurns.delete(turn); // once per turn number
				writeHeapSnapshot(logsDir, `${date}-${time}`, `turn-${turn}`);
			}
		});
		turnStartUnsubscribe = () => sub.unsubscribe();
	} catch (e) {
		console.warn('[fs-mem] could not subscribe to TURN_START events', e);
	}

	// Stall-attribution hook (Plan G scoping): instrumented choke points (MindVision
	// edge calls, the power.log parser burst, game-state batches, facade IPC
	// serialize+send) report their duration through globalThis so shared libs don't
	// depend on this module. Slow ones land in the JSONL next to the stall records,
	// which attributes each stall to a suspect by timestamp.
	(globalThis as any).__fsSlowOp = (category: string, name: string, ms: number, extra?: object) => {
		if (!(ms >= SLOW_OP_THRESHOLD_MS)) {
			return;
		}
		console.log('[fs-mem-slow-op]', category, name, `${Math.round(ms)}ms`, extra ? JSON.stringify(extra) : '');
		writeRecord({ kind: 'slow-op', category, name, ms: Math.round(ms), ...extra });
	};

	const takeSample = () => {
		try {
			const sample = buildSample(injector, maxStallSinceSample);
			maxStallSinceSample = 0;
			writeRecord(sample);
		} catch (e) {
			console.warn('[fs-mem] sampling failed', e);
		}
	};
	sampleTimer = setInterval(takeSample, intervalS * 1000);
	takeSample();

	startCpuProfiler(`memory-${date}-${time}`);
};

/**
 * Opt-in V8 heap snapshots of the main process, for attributing heap growth to
 * constructors/retainers (the ~120 MB/game of main heapUsed growth not explained by
 * the parser state — see the Plan C scoping in docs/electron-memory-investigation.md).
 *
 * FS_ELECTRON_MEM_HEAPSNAPSHOT=1        -> snapshot at GAME_END only
 * FS_ELECTRON_MEM_HEAPSNAPSHOT=8,16     -> snapshots at the start of turns 8 and 16, plus GAME_END
 *
 * v8.writeHeapSnapshot is synchronous and blocks main for seconds (and the file is
 * roughly heap-sized) — dev-only, like the CPU profiler. Analyze with
 * test-tools/perf/analyze-heapsnapshot.mjs.
 */
const parseHeapSnapshotTurns = (): Set<number> | null => {
	const raw = process.env['FS_ELECTRON_MEM_HEAPSNAPSHOT'];
	if (!raw) {
		return null;
	}
	return new Set(
		raw
			.split(',')
			.map((s) => parseInt(s.trim(), 10))
			.filter((n) => Number.isFinite(n) && n > 1),
	);
};

const writeHeapSnapshot = (logsDir: string, sessionName: string, label: string): void => {
	const path = join(logsDir, `heap-${sessionName}-${label}.heapsnapshot`);
	const start = Date.now();
	try {
		v8.writeHeapSnapshot(path);
		console.log('[fs-mem] heap snapshot written', path, `${Date.now() - start}ms`);
		writeRecord({ kind: 'heap-snapshot', label, path, ms: Date.now() - start });
	} catch (e) {
		console.warn('[fs-mem] heap snapshot failed', e);
	}
};

/**
 * Session-wide sampled CPU profile of the main thread, in self-contained chunks so
 * a crash only loses the last chunk. Attributes any main-thread stall (by
 * timestamp) to a JS stack — the generic complement to the targeted __fsSlowOp
 * probes, added after session 6 left the hero-selection stalls unattributed.
 * Chunks land next to the JSONL as cpu-<session>-NNN.cpuprofile (loadable in Chrome
 * DevTools / speedscope).
 *
 * Opt-in via FS_ELECTRON_MEM_CPUPROFILE=1: sessions 7-8 showed the chunk rotation
 * itself blocks main 0.5-2.4 s every rotation (serializing the accumulated profile),
 * which pollutes the stall metrics of ordinary instrumented sessions.
 */
const startCpuProfiler = (sessionName: string): void => {
	if (process.env.FS_ELECTRON_MEM_CPUPROFILE !== '1') {
		return;
	}
	try {
		profilerBasePath = outputFilePath ? join(outputFilePath, '..', `cpu-${sessionName}`) : null;
		profilerSession = new Session();
		profilerSession.connect();
		profilerSession.post('Profiler.enable');
		profilerSession.post('Profiler.start');
		profilerChunkTimer = setInterval(() => rotateCpuProfileChunk(false), CPU_PROFILE_CHUNK_S * 1000);
		console.log('[fs-mem] CPU profiler started', `chunk=${CPU_PROFILE_CHUNK_S}s`, `base=${profilerBasePath}`);
	} catch (e) {
		console.warn('[fs-mem] could not start CPU profiler', e);
		profilerSession = null;
	}
};

const rotateCpuProfileChunk = (final: boolean): Promise<void> => {
	const session = profilerSession;
	if (!session || !profilerBasePath) {
		return Promise.resolve();
	}
	return new Promise((resolve) => {
		session.post('Profiler.stop', (err, result) => {
			const profile = (result as any)?.profile;
			if (!err && profile) {
				const chunkPath = `${profilerBasePath}-${String(profilerChunkIndex).padStart(3, '0')}.cpuprofile`;
				profilerChunkIndex++;
				writeChain = writeChain
					.then(() => writeFile(chunkPath, JSON.stringify(profile)))
					.catch(() => undefined);
			} else if (err) {
				console.warn('[fs-mem] CPU profile chunk failed', err);
			}
			if (!final) {
				session.post('Profiler.start');
			} else {
				try {
					session.disconnect();
				} catch (e) {
					// ignore
				}
				profilerSession = null;
			}
			resolve();
		});
	});
};

export const stopMemoryInstrumentation = async (): Promise<void> => {
	if (sampleTimer) {
		clearInterval(sampleTimer);
		sampleTimer = null;
	}
	if (stallTimer) {
		clearInterval(stallTimer);
		stallTimer = null;
	}
	turnStartUnsubscribe?.();
	turnStartUnsubscribe = null;
	delete (globalThis as any).__fsSlowOp;
	if (profilerChunkTimer) {
		clearInterval(profilerChunkTimer);
		profilerChunkTimer = null;
	}
	await rotateCpuProfileChunk(true);
	await writeChain;
};

const buildSample = (injector: Injector, maxStallSinceSampleMs: number) => {
	// All memory values from getAppMetrics are in KB
	const processes = app.getAppMetrics().map((m) => ({
		pid: m.pid,
		type: m.type,
		serviceName: m.serviceName,
		name: m.name,
		workingSetSizeKb: m.memory?.workingSetSize,
		peakWorkingSetSizeKb: m.memory?.peakWorkingSetSize,
		cpuPercent: m.cpu?.percentCPUUsage,
	}));

	const windows = BrowserWindow.getAllWindows()
		.filter((w) => !w.isDestroyed())
		.map((w) => ({
			id: w.id,
			title: w.getTitle(),
			url: w.webContents?.getURL(),
			osPid: safeCall(() => w.webContents?.getOSProcessId()),
			visible: w.isVisible(),
			minimized: w.isMinimized(),
		}));

	// Catches renderers that are not BrowserWindows: ow-electron overlay infrastructure,
	// <owadview> ad views, webviews, devtools — so every OS process can be attributed
	const allWebContents = webContents
		.getAllWebContents()
		.filter((wc) => !wc.isDestroyed())
		.map((wc) => ({
			id: wc.id,
			type: safeCall(() => wc.getType()),
			url: safeCall(() => wc.getURL()),
			osPid: safeCall(() => wc.getOSProcessId()),
		}));

	const mem = process.memoryUsage();

	return {
		kind: 'sample',
		mainMemory: {
			rss: mem.rss,
			heapTotal: mem.heapTotal,
			heapUsed: mem.heapUsed,
			external: mem.external,
			arrayBuffers: mem.arrayBuffers,
		},
		processes,
		windowCount: windows.length,
		windows,
		allWebContents,
		probes: buildProbes(injector),
		maxStallSinceSampleMs,
	};
};

const buildProbes = (injector: Injector) => {
	const powerLogStats = safeCall(() => injector.get(PowerLogBufferService).getStats());
	const cardsCount = safeCall(() => injector.get(CardsFacadeService).getCards()?.length);

	const parserProbe = safeCall(() => {
		const state = injector.get(GameStateService).state;
		const entities = state?.parserState?.CurrentEntities;
		if (!entities) {
			return { turn: state?.currentTurnNumeric ?? null, entityCount: 0, tagCount: 0, tagsHistoryCount: 0 };
		}
		let tagCount = 0;
		let tagsHistoryCount = 0;
		for (const entity of entities.values()) {
			tagCount += entity?.Tags?.length ?? 0;
			tagsHistoryCount += (entity as any)?.TagsHistory?.length ?? 0;
		}
		return {
			turn: state?.currentTurnNumeric ?? null,
			entityCount: entities.size,
			tagCount,
			tagsHistoryCount,
		};
	});

	return {
		powerLogBuffer: powerLogStats,
		parserState: parserProbe,
		cardsCount,
	};
};

const getCurrentTurn = (injector: Injector): number | null =>
	safeCall(() => injector.get(GameStateService).state?.currentTurnNumeric) ?? null;

const safeCall = <T>(fn: () => T): T | null => {
	try {
		return fn();
	} catch (e) {
		return null;
	}
};

const writeRecord = (record: object): void => {
	if (!outputFilePath) {
		return;
	}
	const line = JSON.stringify({ ts: new Date().toISOString(), ...record }) + '\n';
	// Chain writes so lines never interleave; never block the main thread on IO
	writeChain = writeChain.then(() => appendFile(outputFilePath, line)).catch(() => undefined);
};
