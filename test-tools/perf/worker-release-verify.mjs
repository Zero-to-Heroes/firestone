/**
 * Verify the RAM effect of releasing the idle compute worker (idle TTL added to
 * ComputeWorkerHost, docs/electron-memory-investigation.md): spawns the real
 * bundled worker, sends the real cards DB init (like prewarm), runs a parseJson
 * request to touch the sim code paths, then terminates it and measures how much
 * process RSS the OS gives back.
 *
 * Prerequisite: node apps/electron-app/build-worker.js
 * Usage: node test-tools/perf/worker-release-verify.mjs
 */
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { Worker } from 'worker_threads';

const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const workerPath = path.join(repoRoot, 'dist', 'apps', 'electron-app', 'compute-worker.thread.js');
const cardsPath = path.join(repoRoot, '..', 'hs-reference-data', 'src', 'cards_short.json');

if (!fs.existsSync(workerPath)) {
	console.error(`Worker bundle not found: ${workerPath}. Run: node apps/electron-app/build-worker.js`);
	process.exit(1);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const rssMB = () => process.memoryUsage().rss / 1024 / 1024;
const log = (label, value) => console.log(`${label.padEnd(44)} ${value.toFixed(1).padStart(8)} MB`);

const cardsArray = JSON.parse(fs.readFileSync(cardsPath, 'utf8'));
// Mimic the shape the host clones (AllCardsService-like: array + id map)
const cards = { cards: cardsArray, cache: Object.fromEntries(cardsArray.map((c) => [c.id, c])) };

await sleep(500);
const baseline = rssMB();
log('baseline RSS (cards loaded in main)', baseline);

const worker = new Worker(workerPath);
let nextId = 1;
const pending = new Map();
worker.on('message', (msg) => {
	if (msg.done && pending.has(msg.id)) {
		pending.get(msg.id)(msg);
		pending.delete(msg.id);
	}
});
const request = (req) =>
	new Promise((resolve) => {
		const id = nextId++;
		pending.set(id, resolve);
		worker.postMessage({ ...req, id });
	});

worker.postMessage({ type: 'init', cards: cards });
await sleep(3000);
const afterSpawn = rssMB();
log('after worker spawn + cards clone', afterSpawn);
log('  -> worker resident cost', afterSpawn - baseline);

// Touch a code path so lazy allocations happen
const parsed = await request({ type: 'parseJson', text: JSON.stringify({ a: [...Array(50000).keys()] }) });
if (!parsed?.ok) {
	console.error('parseJson request failed:', parsed?.error);
}
await sleep(1000);
const afterUse = rssMB();
log('after one request', afterUse);

await worker.terminate();
await sleep(3000);
if (globalThis.gc) {
	globalThis.gc();
}
const afterRelease = rssMB();
log('after terminate (idle release)', afterRelease);
log('  -> RSS reclaimed', afterUse - afterRelease);
process.exit(0);
