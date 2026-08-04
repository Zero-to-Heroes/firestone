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
import { existsSync, mkdirSync, statSync } from 'fs';
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
	// opt-in heap snapshots (main + renderers — see writeHeapSnapshots).
	const heapSnapshotTurns = parseHeapSnapshotTurns();
	try {
		const emitter = injector.get(GameEventsEmitterService);
		const sub = emitter.allEvents.subscribe((event: GameEvent) => {
			if (heapSnapshotTurns && event?.type === GameEvent.GAME_END) {
				void writeHeapSnapshots(logsDir, `${date}-${time}`, 'game-end');
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
				void writeHeapSnapshots(logsDir, `${date}-${time}`, `turn-${turn}`);
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
 * Opt-in V8 heap snapshots for attributing memory.
 *
 * FS_ELECTRON_MEM_HEAPSNAPSHOT=1        -> snapshot at GAME_END only
 * FS_ELECTRON_MEM_HEAPSNAPSHOT=8,16     -> snapshots at the start of turns 8 and 16, plus GAME_END
 *
 * Always snapshots the **main** process (v8.writeHeapSnapshot). When
 * FS_ELECTRON_MEM_RENDERER_HEAP is unset or `1` (default when HEAPSNAPSHOT is set),
 * also snapshots every live Firestone Angular webContents (`#/overlay`,
 * `#/battlegrounds`, static loading page, …) via webContents.takeHeapSnapshot — the
 * attribution needed before lite-shell work. Set FS_ELECTRON_MEM_RENDERER_HEAP=0
 * to skip renderers (main-only, cheaper).
 *
 * Snapshots block for seconds and write ~heap-sized files — dev-only. Analyze with
 * test-tools/perf/analyze-heapsnapshot.mjs. Compare total V8 self-size to the Tab's
 * workingSetSize in the JSONL `heap-snapshot` record to see non-V8 Chromium cost.
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
			.filter((n) => Number.isFinite(n) && n >= 1),
	);
};

const shouldSnapshotRenderers = (): boolean => process.env['FS_ELECTRON_MEM_RENDERER_HEAP'] !== '0';

const routeSlugFromUrl = (url: string): string => {
	try {
		const hash = url.includes('#') ? url.split('#')[1] : '';
		const path = (hash || url).replace(/^\//, '').split('?')[0];
		if (path.includes('overlay')) {
			return 'overlay';
		}
		if (path.includes('battlegrounds')) {
			return 'battlegrounds';
		}
		if (path.includes('loading')) {
			return 'loading';
		}
		if (path.includes('settings')) {
			return 'settings';
		}
		if (path.includes('collection')) {
			return 'collection';
		}
		if (path.includes('lottery')) {
			return 'lottery';
		}
		if (url.startsWith('devtools:')) {
			return 'devtools';
		}
		if (url.startsWith('owepm:')) {
			return 'owepm';
		}
		if (url.includes('adview')) {
			return 'owadview';
		}
		return `wc-${path.slice(0, 24) || 'unknown'}`.replace(/[^a-z0-9_-]+/gi, '-');
	} catch {
		return 'unknown';
	}
};

const writeHeapSnapshots = async (logsDir: string, sessionName: string, label: string): Promise<void> => {
	writeMainHeapSnapshot(logsDir, sessionName, label);
	if (!shouldSnapshotRenderers()) {
		return;
	}
	const metricsByPid = new Map(
		app.getAppMetrics().map((m) => [m.pid, Math.round((m.memory?.workingSetSize ?? 0) / 1024)]),
	);
	for (const wc of webContents.getAllWebContents()) {
		try {
			if (wc.isDestroyed()) {
				continue;
			}
			const url = wc.getURL() || '';
			// Skip empty / about:blank mid-navigation
			if (!url || url === 'about:blank') {
				continue;
			}
			const slug = routeSlugFromUrl(url);
			const osPid = wc.getOSProcessId();
			const path = join(logsDir, `heap-${sessionName}-${label}-${slug}-pid${osPid}.heapsnapshot`);
			const start = Date.now();
			await wc.takeHeapSnapshot(path);
			const ok = existsSync(path) && statSync(path).size > 0;
			const wsMB = metricsByPid.get(osPid) ?? null;
			console.log(
				'[fs-mem] renderer heap snapshot',
				ok ? 'ok' : 'FAILED',
				slug,
				`pid=${osPid}`,
				wsMB != null ? `rss=${wsMB}MB` : '',
				path,
				`${Date.now() - start}ms`,
			);
			writeRecord({
				kind: 'heap-snapshot',
				scope: 'renderer',
				label,
				slug,
				url: url.slice(0, 200),
				pid: osPid,
				workingSetSizeMb: wsMB,
				path,
				ok,
				ms: Date.now() - start,
			});
		} catch (e) {
			console.warn('[fs-mem] renderer heap snapshot failed', e);
		}
	}
};

const writeMainHeapSnapshot = (logsDir: string, sessionName: string, label: string): void => {
	const path = join(logsDir, `heap-${sessionName}-${label}-main.heapsnapshot`);
	const start = Date.now();
	try {
		v8.writeHeapSnapshot(path);
		const rssMB = Math.round(process.memoryUsage().rss / (1024 * 1024));
		console.log('[fs-mem] main heap snapshot written', path, `rss=${rssMB}MB`, `${Date.now() - start}ms`);
		writeRecord({
			kind: 'heap-snapshot',
			scope: 'main',
			label,
			path,
			workingSetSizeMb: rssMB,
			ms: Date.now() - start,
		});
	} catch (e) {
		console.warn('[fs-mem] main heap snapshot failed', e);
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
