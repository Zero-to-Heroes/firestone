/**
 * Verify the Electron persistent compute worker (Plans F + H,
 * docs/electron-memory-investigation.md) against the historical main-thread path,
 * using a real BG power.log:
 *
 *  1. Replays the power.log through ReplayParser and builds the replay XML with
 *     xmlFromReplay (same as GAME_END in production).
 *  2. Runs parseBattlegroundsGame / extractStatsForGame / DEFLATE zip on the main
 *     thread (reference) and through dist/apps/electron-app/compute-worker.thread.js,
 *     comparing results for equality and reporting timings, including how long the
 *     main thread stays blocked in each mode.
 *  3. Smoke-tests the streaming battle-sim protocol (Plan F): a minimal battle must
 *     stream intermediate results and finish with a plausible final result.
 *
 * Prerequisites:
 *  - node apps/electron-app/build-worker.js (bundles the worker)
 *  - cards_short.json available (../hs-reference-data or HS_REFERENCE_CARDS_JSON_PATH)
 *
 * Usage (from repo root):
 *   node --import tsx test-tools/perf/compute-worker-verify.mjs [path/to/power.log]
 *
 * Defaults to test-tools/bg.log (full-length BG game, not checked in; fall back to
 * test-tools/non-reg/bg.log if missing).
 */
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { Worker } from 'worker_threads';

const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

const importTs = async (...segments) =>
	(await import(pathToFileURL(path.join(repoRoot, ...segments)).href)).default ??
	(await import(pathToFileURL(path.join(repoRoot, ...segments)).href));

const { ReplayParser } = await importTs('libs', 'power-log-parser', 'src', 'lib', 'replay-parser.ts');
const { joinWrappedPowerLogLines } = await importTs(
	'libs',
	'power-log-parser',
	'src',
	'lib',
	'join-wrapped-power-log-lines.ts',
);
const { xmlFromReplay } = await importTs('libs', 'power-log-parser', 'src', 'lib', 'replay-converter.ts');

const { AllCardsService } = await import('@firestone-hs/reference-data');
const { parseBattlegroundsGame, parseHsReplayString } = await import(
	'@firestone-hs/hs-replay-xml-parser/dist/public-api'
);
const { extractStatsForGame } = await import('@firestone-hs/build-global-stats/dist/stats-builder');
const JSZip = (await import('jszip')).default;

const defaultLog = fs.existsSync(path.join(repoRoot, 'test-tools', 'bg.log'))
	? path.join(repoRoot, 'test-tools', 'bg.log')
	: path.join(repoRoot, 'test-tools', 'non-reg', 'bg.log');
const logPath = process.argv[2] ?? defaultLog;
const workerPath = path.join(repoRoot, 'dist', 'apps', 'electron-app', 'compute-worker.thread.js');

if (!fs.existsSync(logPath)) {
	console.error(`Power log not found: ${logPath}`);
	process.exit(1);
}
if (!fs.existsSync(workerPath)) {
	console.error(`Worker bundle not found: ${workerPath}. Run: node apps/electron-app/build-worker.js`);
	process.exit(1);
}

console.debug = () => {};

const fail = (msg) => {
	console.error(`FAIL: ${msg}`);
	process.exitCode = 1;
};

// ---------- 1. Build the replay XML from the power log (same as GAME_END) ----------
const cardsJsonPath =
	process.env.HS_REFERENCE_CARDS_JSON_PATH ??
	path.join(repoRoot, '..', 'hs-reference-data', 'src', 'cards_short.json');
if (!fs.existsSync(cardsJsonPath)) {
	console.error(`cards_short.json not found at ${cardsJsonPath}; set HS_REFERENCE_CARDS_JSON_PATH`);
	process.exit(1);
}
const cards = new AllCardsService();
cards.initializeCardsDbFromCards(JSON.parse(fs.readFileSync(cardsJsonPath, 'utf8')));

const rawLines = fs.readFileSync(logPath, 'utf8').split(/\r?\n/);
const parser = new ReplayParser();
parser.onGameEvent = () => {};
parser.Init();
const seed = parser.ExtractGameSeed(rawLines);
const normalized = joinWrappedPowerLogLines(rawLines);
console.log(`Parsing ${normalized.length} lines from ${logPath}`);
let t = Date.now();
for (let i = 0; i < normalized.length; i++) {
	parser.ReadLine(normalized[i], seed, i);
	if (i % 500 === 499) {
		parser.State.GSState.NodeParser.ClearQueue();
		parser.State.PTLState.NodeParser.ClearQueue();
	}
}
parser.State.GSState.NodeParser.ClearQueue();
parser.State.PTLState.NodeParser.ClearQueue();
console.log(`Replayed power log in ${Date.now() - t} ms`);

t = Date.now();
const xml = xmlFromReplay(parser.State.GSState.Replay);
console.log(`xmlFromReplay: ${Date.now() - t} ms, ${(xml.length / 1024 / 1024).toFixed(2)} MB`);

// Realistic-ish BgsPlayer input; both paths receive the same object, so results stay comparable
const replay = parseHsReplayString(xml, cards);
const mainPlayer = {
	cardId: replay.mainPlayerCardId,
	heroPowerCardId: '',
	name: 'verify',
	isMainPlayer: true,
	tavernUpgradeHistory: [],
	tripleHistory: [],
	compositionHistory: [],
	boardHistory: [],
	initialHealth: 30,
	damageTaken: 0,
	leaderboardPlace: 1,
	currentWinStreak: 0,
	highestWinStreak: 0,
};
const reviewMessage = {
	reviewId: 'verify-review-id',
	gameMode: 'battlegrounds',
	replayKey: '',
	playerRank: '6000',
	uploaderToken: '',
};

// ---------- 2. Main-thread reference ----------
t = Date.now();
const refPostMatch = parseBattlegroundsGame(xml, mainPlayer, [], [], cards);
const refParseMs = Date.now() - t;
console.log(`[main] parseBattlegroundsGame: ${refParseMs} ms`);

t = Date.now();
const refGlobalStats = await extractStatsForGame(reviewMessage, xml, cards);
const refExtractMs = Date.now() - t;
console.log(`[main] extractStatsForGame: ${refExtractMs} ms`);

t = Date.now();
const refZipper = new JSZip();
refZipper.file('replay.xml', xml);
const refZip = await refZipper.generateAsync({
	type: 'uint8array',
	compression: 'DEFLATE',
	compressionOptions: { level: 9 },
});
const refZipMs = Date.now() - t;
console.log(`[main] JSZip DEFLATE-9: ${refZipMs} ms, ${(refZip.length / 1024 / 1024).toFixed(2)} MB`);

// ---------- 3. Worker path ----------
const worker = new Worker(workerPath);
const pending = new Map();
worker.on('message', (m) => pending.get(m.id)?.(m));
worker.on('error', (e) => fail(`worker error: ${e?.message ?? e}`));
let requestId = 0;
const request = (payload) =>
	new Promise((resolve) => {
		const id = ++requestId;
		pending.set(id, (m) => {
			pending.delete(id);
			resolve(m);
		});
		worker.postMessage({ id, ...payload });
	});

// Track how long the main thread stays blocked while the worker computes
let maxMainStallMs = 0;
let lastTick = Date.now();
const stallProbe = setInterval(() => {
	const now = Date.now();
	maxMainStallMs = Math.max(maxMainStallMs, now - lastTick - 50);
	lastTick = now;
}, 50);

worker.postMessage({ type: 'init', cards });

t = Date.now();
const workerParse = await request({
	type: 'parseBattlegroundsGame',
	xml,
	mainPlayer,
	battleResultHistory: [],
	faceOffs: [],
});
console.log(`[worker] parseBattlegroundsGame: ${Date.now() - t} ms (incl. init/cards clone), ok=${workerParse.ok}`);

t = Date.now();
const workerExtract = await request({ type: 'extractStatsForGame', message: reviewMessage, xml });
console.log(`[worker] extractStatsForGame: ${Date.now() - t} ms, ok=${workerExtract.ok}`);

t = Date.now();
const workerZip = await request({ type: 'zipSingleFile', fileName: 'replay.xml', content: xml });
console.log(`[worker] zipSingleFile: ${Date.now() - t} ms, ok=${workerZip.ok}`);

// ---------- 3b. Battle sim smoke test (Plan F): streams then finishes ----------
const simPlayer = (cardId) => ({ cardId, hpLeft: 30, tavernTier: 3, heroPowers: [], questEntities: [] });
const simBattleInfo = {
	playerBoard: {
		player: simPlayer('TB_BaconShop_HERO_44'),
		board: [{ entityId: 101, cardId: 'CFM_315', attack: 1, health: 1 }],
	},
	opponentBoard: {
		player: simPlayer('TB_BaconShop_HERO_01'),
		board: [{ entityId: 201, cardId: 'CFM_315', attack: 1, health: 1 }],
	},
	options: { numberOfSimulations: 800, intermediateResults: 200, includeOutcomeSamples: false, skipInfoLogs: true },
	gameState: { currentTurn: 5, validTribes: [] },
};
t = Date.now();
const simResult = await new Promise((resolve) => {
	const id = ++requestId;
	let intermediates = 0;
	pending.set(id, (m) => {
		if (!m.done) {
			intermediates++;
			return;
		}
		pending.delete(id);
		resolve({ ...m, intermediates });
	});
	worker.postMessage({ id, type: 'simulateBattle', battleInfo: simBattleInfo });
});
console.log(
	`[worker] simulateBattle: ${Date.now() - t} ms, ok=${simResult.ok}, intermediates=${simResult.intermediates}`,
);

clearInterval(stallProbe);
await worker.terminate();

// ---------- 4. Compare ----------
if (!workerParse.ok) fail(`worker parseBattlegroundsGame failed: ${workerParse.error}`);
else if (workerParse.result !== JSON.stringify(refPostMatch)) {
	fail('parseBattlegroundsGame results differ between main thread and worker');
}

if (!workerExtract.ok) fail(`worker extractStatsForGame failed: ${workerExtract.error}`);
else if (workerExtract.result !== JSON.stringify(refGlobalStats)) {
	fail('extractStatsForGame results differ between main thread and worker');
}

if (!simResult.ok) {
	fail(`worker simulateBattle failed: ${simResult.error}`);
} else {
	const sim = JSON.parse(simResult.result);
	const totalSims = (sim.won ?? 0) + (sim.tied ?? 0) + (sim.lost ?? 0);
	if (totalSims < 700) fail(`worker simulateBattle final result looks wrong: ${totalSims} sims`);
	if (!simResult.intermediates) fail('worker simulateBattle did not stream intermediate results');
}

if (!workerZip.ok) {
	fail(`worker zipSingleFile failed: ${workerZip.error}`);
} else {
	// Zip bytes are not byte-identical (timestamps in headers); compare the inflated content
	const reopened = await JSZip.loadAsync(workerZip.resultBytes);
	const roundTripped = await reopened.file('replay.xml').async('string');
	if (roundTripped !== xml) fail('worker zip content does not round-trip to the original XML');
}

console.log(
	`Max main-thread stall while worker was computing: ${maxMainStallMs} ms ` +
		`(vs ${refParseMs + refExtractMs + refZipMs} ms total blocking on the main-thread path)`,
);
console.log(process.exitCode ? 'RESULT: FAIL' : 'RESULT: PASS');
