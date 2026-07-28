/**
 * Verify the compute worker's zipPowerLogFile op (Plan C track 1 / the Electron
 * empty-power.log-upload bug, docs/electron-memory-investigation.md):
 *
 *  1. Sends a real on-disk Power.log path to the bundled worker.
 *  2. Unzips the returned bytes and checks the content is exactly the last completed
 *     game: starts at a CREATE_GAME line, contains a completion marker, and matches
 *     the trim helper run in-process on the same file.
 *  3. Exercises the "new game already started" race with a synthetic file
 *     (completed game + started-but-unfinished game): the zip must contain the
 *     completed game only.
 *
 * Prerequisite: node apps/electron-app/build-worker.js
 * Usage: node --import tsx test-tools/perf/zip-powerlog-verify.mjs [path/to/Power.log]
 */
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { Worker } from 'worker_threads';

const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const workerPath = path.join(repoRoot, 'dist', 'apps', 'electron-app', 'compute-worker.thread.js');
const { trimPowerLogLinesToLastCompletedGame } = await import(
	pathToFileURL(path.join(repoRoot, 'libs', 'power-log-parser', 'src', 'lib', 'trim-power-log-last-game.ts')).href
);
const JSZip = (await import('jszip')).default;

const logPath = process.argv[2] ?? 'D:/Games/Hearthstone/Logs/Hearthstone_2026_07_28_12_51_28/Power.log';

if (!fs.existsSync(workerPath)) {
	console.error(`Worker bundle not found: ${workerPath}. Run: node apps/electron-app/build-worker.js`);
	process.exit(1);
}

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

async function unzipPowerLog(bytes) {
	const zip = await JSZip.loadAsync(bytes);
	return zip.file('power.log').async('string');
}

let failures = 0;
const check = (label, ok, detail = '') => {
	console.log(`${ok ? 'PASS' : 'FAIL'}: ${label}${detail ? ' — ' + detail : ''}`);
	if (!ok) failures++;
};

// 1+2: real log
if (fs.existsSync(logPath)) {
	const t = Date.now();
	const resp = await request({ type: 'zipPowerLogFile', path: logPath });
	const elapsed = Date.now() - t;
	check('worker returned ok', !!resp.ok, resp.error ?? '');
	if (resp.ok) {
		const unzipped = await unzipPowerLog(resp.resultBytes);
		const expected = trimPowerLogLinesToLastCompletedGame(fs.readFileSync(logPath, 'utf8').split(/\r?\n/)).join(
			'\n',
		);
		check('content matches in-process trim', unzipped === expected, `${unzipped.length} chars, ${elapsed} ms`);
		check('starts at CREATE_GAME', unzipped.split('\n')[0].includes('CREATE_GAME'), unzipped.split('\n')[0]);
		check(
			'contains completion marker',
			unzipped.includes('tag=STATE value=COMPLETE') || unzipped.includes('tag=PLAYSTATE value=CONCEDED'),
		);
		console.log('stats:', resp.result);
	}
} else {
	console.warn(`real log not found (${logPath}), skipping real-log checks`);
}

// 3: race — a completed game followed by a started-but-unfinished one
const mk = (ts, s) => `D ${ts} ${s}`;
const synthetic = [
	mk('10:00:00.0000000', 'GameState.DebugPrintPower() - CREATE_GAME'),
	mk('10:00:01.0000000', 'GameState.DebugPrintPower() -     GameEntity EntityID=1'),
	mk('10:20:00.0000000', 'GameState.DebugPrintPower() - TAG_CHANGE Entity=GameEntity tag=STATE value=COMPLETE'),
	mk('10:21:00.0000000', 'GameState.DebugPrintPower() - CREATE_GAME'),
	mk('10:21:01.0000000', 'GameState.DebugPrintPower() -     GameEntity EntityID=1'),
].join('\n');
const tmpFile = path.join(os.tmpdir(), `fs-zip-powerlog-verify-${Date.now()}.log`);
fs.writeFileSync(tmpFile, synthetic, 'utf8');
const raceResp = await request({ type: 'zipPowerLogFile', path: tmpFile });
if (raceResp.ok) {
	const unzipped = await unzipPowerLog(raceResp.resultBytes);
	const lines = unzipped.split('\n');
	check(
		'race: returns the completed game only',
		lines.length === 3 && lines[0].includes('10:00:00') && lines[2].includes('value=COMPLETE'),
		`${lines.length} lines`,
	);
} else {
	check('race: worker returned ok', false, raceResp.error ?? '');
}
fs.unlinkSync(tmpFile);

await worker.terminate();
process.exit(failures ? 1 : 0);
