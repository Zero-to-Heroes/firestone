/**
 * Summarize FS_ELECTRON_MEM JSONL samples for multi-game leak sessions.
 *
 * Usage:
 *   node test-tools/perf/summarize-cross-game-mem.mjs <memory-*.jsonl> [main-*.log]
 *
 * Correlates [fake-game] iteration markers from the main log (if given) with
 * nearby samples, and prints Overlay/BG/Browser/GPU/main heapUsed deltas.
 */
import fs from 'fs';

const memPath = process.argv[2];
const mainLogPath = process.argv[3];
if (!memPath) {
	console.error('Usage: node summarize-cross-game-mem.mjs <memory.jsonl> [main.log]');
	process.exit(1);
}

const records = fs
	.readFileSync(memPath, 'utf8')
	.trim()
	.split(/\n/)
	.filter(Boolean)
	.map((l) => JSON.parse(l));
const samples = records.filter((r) => r.kind === 'sample');
const heaps = records.filter((r) => r.kind === 'heap-snapshot');

const iterations = [];
if (mainLogPath && fs.existsSync(mainLogPath)) {
	const log = fs.readFileSync(mainLogPath, 'utf8');
	for (const line of log.split(/\n/)) {
		const mStart = line.match(/\[fake-game\] iteration start (\{.*\})/);
		const mDone = line.match(/\[fake-game\] iteration done (\{.*\})/);
		const mSettle = line.match(/\[fake-game\] settle (\{.*\})/);
		const tsMatch = line.match(/^\[([^\]]+)\]/);
		const ts = tsMatch ? tsMatch[1] : null;
		if (mStart) {
			const j = JSON.parse(mStart[1]);
			iterations.push({ phase: 'start', ts, ...j });
		} else if (mDone) {
			const j = JSON.parse(mDone[1]);
			iterations.push({ phase: 'done', ts, ...j });
		} else if (mSettle) {
			const j = JSON.parse(mSettle[1]);
			iterations.push({ phase: 'settle', ts, ...j });
		}
	}
}

const summarizeSample = (s) => {
	const byPid = Object.fromEntries((s.processes || []).map((m) => [m.pid, Math.round((m.workingSetSizeKb || 0) / 1024)]));
	const gpu = (s.processes || []).find((p) => p.type === 'GPU');
	const browser = (s.processes || []).find((p) => p.type === 'Browser');
	const ov = (s.allWebContents || []).find((w) => /#\/overlay/.test(w.url || ''));
	const bg = (s.allWebContents || []).find((w) => /#\/battlegrounds/.test(w.url || ''));
	return {
		ts: s.ts,
		overlayTabMB: ov ? byPid[ov.osPid] : null,
		bgTabMB: bg ? byPid[bg.osPid] : null,
		gpuMB: gpu ? Math.round((gpu.workingSetSizeKb || 0) / 1024) : null,
		browserMB: browser ? Math.round((browser.workingSetSizeKb || 0) / 1024) : null,
		mainHeapUsedMB: s.mainMemory ? Math.round(s.mainMemory.heapUsed / 1024 / 1024) : null,
		mainRssMB: s.mainMemory ? Math.round(s.mainMemory.rss / 1024 / 1024) : null,
		probes: s.probes,
	};
};

console.log('samples', samples.length, 'heap-snapshots', heaps.length);
console.log('iteration markers', iterations.length);
for (const it of iterations) {
	console.log('  marker', it);
}

const withOverlay = samples.filter((s) => (s.allWebContents || []).some((w) => /#\/overlay/.test(w.url || '')));
console.log('\n=== last 8 overlay samples ===');
for (const s of withOverlay.slice(-8)) {
	console.log(summarizeSample(s));
}

// Pick sample nearest after each iteration-done marker (by wall clock if ISO-ish)
const parseLooseTs = (ts) => {
	if (!ts) return null;
	const d = Date.parse(ts);
	return Number.isFinite(d) ? d : null;
};

if (iterations.some((i) => i.phase === 'done')) {
	console.log('\n=== per-iteration post-done samples (nearest after done) ===');
	const doneMarks = iterations.filter((i) => i.phase === 'done');
	for (const mark of doneMarks) {
		const t0 = parseLooseTs(mark.ts);
		let best = null;
		let bestDt = Infinity;
		for (const s of withOverlay) {
			const st = parseLooseTs(s.ts);
			if (t0 == null || st == null) continue;
			const dt = st - t0;
			if (dt >= 0 && dt < bestDt) {
				bestDt = dt;
				best = s;
			}
		}
		// fallback: last sample with highest turn in window
		if (!best && withOverlay.length) {
			best = withOverlay[withOverlay.length - 1];
		}
		console.log({
			iteration: mark.iteration,
			markerTs: mark.ts,
			sampleDtMs: bestDt === Infinity ? null : bestDt,
			...summarizeSample(best || {}),
		});
	}
}

console.log('\n=== heap snapshot metas ===');
for (const h of heaps) {
	const base = (h.path || '').split(/[/\\]/).pop();
	console.log({
		base,
		label: h.label,
		workingSetSizeMb: h.workingSetSizeKb != null ? Math.round(h.workingSetSizeKb / 1024) : null,
		...Object.fromEntries(Object.entries(h).filter(([k]) => !['path', 'kind'].includes(k))),
	});
}

// Simple growth: first vs last overlay sample with turn>=1
const midGame = withOverlay
	.map(summarizeSample)
	.filter((s) => (s.probes?.turn ?? 0) > 0);
if (midGame.length >= 2) {
	const first = midGame[0];
	const last = midGame[midGame.length - 1];
	console.log('\n=== first→last mid-game overlay sample delta ===');
	console.log({
		first,
		last,
		dOverlay: (last.overlayTabMB ?? 0) - (first.overlayTabMB ?? 0),
		dBg: (last.bgTabMB ?? 0) - (first.bgTabMB ?? 0),
		dBrowser: (last.browserMB ?? 0) - (first.browserMB ?? 0),
		dGpu: (last.gpuMB ?? 0) - (first.gpuMB ?? 0),
		dMainHeap: (last.mainHeapUsedMB ?? 0) - (first.mainHeapUsedMB ?? 0),
		dMainRss: (last.mainRssMB ?? 0) - (first.mainRssMB ?? 0),
	});
}
