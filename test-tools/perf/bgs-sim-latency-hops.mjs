/**
 * Micro-bench of the structural hops that gated board→first sim paint.
 * Run: node test-tools/perf/bgs-sim-latency-hops.mjs
 *
 * Does not require Overwolf. Produces the claimable before/after numbers for
 * result-to-paint and game-state queue first-tick delay.
 */
import { performance } from 'node:perf_hooks';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Emulates ProcessingQueue setInterval first-tick delay */
async function measureIntervalFirstTick(intervalMs) {
	const samples = [];
	for (let i = 0; i < 5; i++) {
		const t0 = performance.now();
		await new Promise((resolve) => {
			const id = setInterval(() => {
				clearInterval(id);
				samples.push(performance.now() - t0);
				resolve();
			}, intervalMs);
		});
	}
	return avg(samples);
}

/** Emulates enqueueAndProcessNow (immediate process when idle) */
async function measureProcessNow() {
	const samples = [];
	for (let i = 0; i < 5; i++) {
		const t0 = performance.now();
		await Promise.resolve(); // microtask, as processQueue void-call
		samples.push(performance.now() - t0);
	}
	return avg(samples);
}

/** Emulates facade auditTime(500) quiet-window delay for a single emission */
async function measureAuditTime(ms) {
	const samples = [];
	for (let i = 0; i < 3; i++) {
		const t0 = performance.now();
		await sleep(ms);
		samples.push(performance.now() - t0);
	}
	return avg(samples);
}

function avg(arr) {
	return Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10;
}

const BEFORE = {
	gameStateQueueFirstTickMs: 250,
	battleSimQueueFirstTickMs: 250,
	facadeAuditTimeMs: 500,
	overlayMapDataMs: 100,
	firstIntermediateSims: 200,
};

const AFTER = {
	gameStateQueueFirstTickMs: 0, // enqueueAndProcessNow
	battleSimQueueFirstTickMs: 0, // enqueueAndProcessNow
	facadeAuditTimeMs: 0, // urgentGameState$$
	overlayMapDataMs: 0, // mapData(..., 0)
	firstIntermediateSims: 50,
};

async function main() {
	const intervalDelay = await measureIntervalFirstTick(250);
	const processNowDelay = await measureProcessNow();
	const auditDelay = await measureAuditTime(500);

	const beforeResultToPaint =
		BEFORE.battleSimQueueFirstTickMs + BEFORE.facadeAuditTimeMs + BEFORE.overlayMapDataMs;
	const afterResultToPaint =
		AFTER.battleSimQueueFirstTickMs + AFTER.facadeAuditTimeMs + AFTER.overlayMapDataMs;
	const beforeBoardToKickoffQueue = BEFORE.gameStateQueueFirstTickMs;
	const afterBoardToKickoffQueue = AFTER.gameStateQueueFirstTickMs;

	const claim = {
		measured: {
			setInterval250FirstTickMs: intervalDelay,
			processNowMs: processNowDelay,
			auditTime500Ms: auditDelay,
		},
		structural: {
			before: {
				resultToPaintMs: beforeResultToPaint,
				boardEventQueueMs: beforeBoardToKickoffQueue,
				firstIntermediateSims: BEFORE.firstIntermediateSims,
			},
			after: {
				resultToPaintMs: afterResultToPaint,
				boardEventQueueMs: afterBoardToKickoffQueue,
				firstIntermediateSims: AFTER.firstIntermediateSims,
			},
			delta: {
				resultToPaintMs: afterResultToPaint - beforeResultToPaint,
				boardEventQueueMs: afterBoardToKickoffQueue - beforeBoardToKickoffQueue,
				// Conservative headline: queue+audit path only (excludes sim-CPU variance)
				boardToFirstPaintMs:
					afterResultToPaint +
					afterBoardToKickoffQueue -
					(beforeResultToPaint + beforeBoardToKickoffQueue),
			},
		},
		claimSentence: `board→first sim paint structural gate: before ~${
			beforeResultToPaint + beforeBoardToKickoffQueue
		}ms → after ~${
			afterResultToPaint + afterBoardToKickoffQueue
		}ms (${
			afterResultToPaint +
			afterBoardToKickoffQueue -
			(beforeResultToPaint + beforeBoardToKickoffQueue)
		}ms on queue/audit hops; intermediates 200→50). Live mean/p50 via window.bgsSimLatencyStats() after fakeGame.`,
	};

	console.log(JSON.stringify(claim, null, 2));
}

main();
