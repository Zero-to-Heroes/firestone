/**
 * Attribute the parser's main-process heap growth to its components (Plan C scoping,
 * docs/electron-memory-investigation.md): parses a power.log, then measures heapUsed
 * deltas after surgically dropping each component and forcing GC.
 *
 * Usage: node --expose-gc --import tsx test-tools/perf/parser-heap-breakdown.mjs [path/to/power.log]
 */
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const importTs = async (...segments) => {
	const m = await import(pathToFileURL(path.join(repoRoot, ...segments)).href);
	return m.default ?? m;
};
const { ReplayParser } = await importTs('libs', 'power-log-parser', 'src', 'lib', 'replay-parser.ts');
const { joinWrappedPowerLogLines } = await importTs(
	'libs',
	'power-log-parser',
	'src',
	'lib',
	'join-wrapped-power-log-lines.ts',
);

const logPath = process.argv[2] ?? path.join(repoRoot, 'test-tools', 'bg.log');
const gc = globalThis.gc;
if (!gc) {
	console.error('Run with node --expose-gc');
	process.exit(1);
}

const heapMB = () => {
	gc();
	gc();
	return process.memoryUsage().heapUsed / 1024 / 1024;
};

const rawLines = fs.readFileSync(logPath, 'utf8').split(/\r?\n/);
const lines = joinWrappedPowerLogLines(rawLines);
console.log(`parsing ${lines.length} lines from ${logPath}`);

const baseline = heapMB();
const parser = new ReplayParser();
for (const line of lines) {
	parser.ReadLine(line);
}
// Drop the raw log text before measuring
rawLines.length = 0;
lines.length = 0;

const afterParse = heapMB();
console.log(`heapUsed baseline ${baseline.toFixed(1)} MB, after parse ${afterParse.toFixed(1)} MB`);
console.log(`parser total: ${(afterParse - baseline).toFixed(1)} MB\n`);

const states = [
	['GSState', parser.State?.GSState],
	['PTLState', parser.State?.PTLState],
].filter(([, s]) => s != null);

let prev = afterParse;
const drop = (label, fn) => {
	fn();
	const now = heapMB();
	console.log(`${label.padEnd(52)} ${(prev - now).toFixed(1).padStart(8)} MB`);
	prev = now;
};

for (const [name, state] of states) {
	const entities = state.GameState?.CurrentEntities;
	const entityCount = entities?.size ?? 0;
	console.log(`--- ${name}: ${entityCount} entities ---`);
	drop(`${name} TagsHistory arrays`, () => {
		for (const e of entities?.values() ?? []) {
			e.TagsHistory = [];
		}
	});
	drop(`${name} AllPreviousTags arrays`, () => {
		for (const e of entities?.values() ?? []) {
			e.AllPreviousTags = [];
		}
	});
	drop(`${name} CurrentGame.Data tree (replay tree)`, () => {
		if (state.CurrentGame) {
			state.CurrentGame.Data = [];
		}
		if (state.Replay?.Games) {
			for (const g of state.Replay.Games) {
				g.Data = [];
			}
		}
	});
	drop(`${name} entity index`, () => {
		state._entityIndex?.clear?.();
		if (state._entityIndex && !state._entityIndex.clear) {
			state._entityIndex = null;
		}
	});
	drop(`${name} CurrentEntities map`, () => {
		entities?.clear?.();
	});
}

drop('everything else (parser released)', () => {
	// eslint-disable-next-line no-unused-vars
	parser.State = null;
});
console.log(`\nresidual heap over baseline: ${(prev - baseline).toFixed(1)} MB`);
