/**
 * Per-turn parsing performance measurement for ReplayParser.
 *
 * Parses a power log line by line through the TS parser (with periodic event-queue
 * flushes, mimicking how GameEvents feeds the parser in the app) and prints, for each
 * turn: number of log lines, total parse time, average cost per line, and the running
 * emitted-event count. A healthy parser shows a flat us/line column across turns; a
 * growing us/line column means per-line cost scales with game length (quadratic total).
 *
 * Usage (from the repo root):
 *   node --import tsx test-tools/perf/parse-log-perf.mjs [path/to/power.log]
 *   POWER_LOG_PERF_PATH=path/to/power.log node --import tsx test-tools/perf/parse-log-perf.mjs
 * Defaults to test-tools/bg.log.
 *
 * Reference numbers on test-tools/bg.log (1.03M lines, 39 turns, BG game):
 *  - Before the 2026-07 GetEntity fix: us/line grew from ~20 (turn 1) to ~2800 (turn 37);
 *    total ~997,000 ms. Root cause: DungeonRunStepParser / RumbleRunStepParser called
 *    ParserState.GetEntity (a full CurrentGame.Data history scan via FilterGameData) on
 *    every closed Action node.
 *  - After the fix: us/line flat at ~9-16 across all turns; total ~14,000 ms;
 *    35,859 events emitted.
 */
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

// Interop: under `node --import tsx` these CJS-transpiled modules expose their named
// exports on `default`.
const replayParserModule = await import(
	pathToFileURL(path.join(repoRoot, 'libs', 'power-log-parser', 'src', 'lib', 'replay-parser.ts')).href
);
const joinModule = await import(
	pathToFileURL(path.join(repoRoot, 'libs', 'power-log-parser', 'src', 'lib', 'join-wrapped-power-log-lines.ts')).href
);
const { ReplayParser } = replayParserModule.default ?? replayParserModule;
const { joinWrappedPowerLogLines } = joinModule.default ?? joinModule;

const logPath = process.argv[2] ?? process.env.POWER_LOG_PERF_PATH ?? path.join(repoRoot, 'test-tools', 'bg.log');
if (!fs.existsSync(logPath)) {
	console.error(`Power log not found: ${logPath}`);
	process.exit(1);
}

// The parser logs copiously through console.debug; silence it so we measure parsing, not I/O.
console.debug = () => {};

const rawLines = fs.readFileSync(logPath, 'utf8').split(/\r?\n/);
const parser = new ReplayParser();
let events = 0;
parser.onGameEvent = () => {
	events++;
};
parser.Init();
const seed = parser.ExtractGameSeed(rawLines);
const normalized = joinWrappedPowerLogLines(rawLines);
console.log(`Parsing ${normalized.length} lines from ${logPath}`);

const flush = () => {
	parser.State.GSState.NodeParser.ClearQueue();
	parser.State.PTLState.NodeParser.ClearQueue();
};

let turn = 0;
let stats = { lines: 0, ms: 0 };
const printTurn = () => {
	console.log(
		String(turn).padStart(4),
		String(stats.lines).padStart(7),
		String(Math.round(stats.ms)).padStart(8),
		((1000 * stats.ms) / stats.lines).toFixed(2).padStart(9),
		String(events).padStart(8),
	);
};

console.log('turn   lines       ms   us/line  events');
const startAll = process.hrtime.bigint();
for (let i = 0; i < normalized.length; i++) {
	const line = normalized[i];
	const start = process.hrtime.bigint();
	parser.ReadLine(line, seed, i);
	// Flush the event queues regularly, like the app's 500ms batching does.
	if (i % 500 === 499) {
		flush();
	}
	stats.ms += Number(process.hrtime.bigint() - start) / 1e6;
	stats.lines++;
	if (line.includes('GameState') && line.includes('tag=TURN value=')) {
		const m = /TAG_CHANGE Entity=GameEntity tag=TURN value=(\d+)/.exec(line);
		if (m) {
			printTurn();
			turn = parseInt(m[1], 10);
			stats = { lines: 0, ms: 0 };
		}
	}
}
flush();
printTurn();
const totalMs = Number(process.hrtime.bigint() - startAll) / 1e6;
console.log(`TOTAL: ${Math.round(totalMs)} ms, ${events} events emitted`);
