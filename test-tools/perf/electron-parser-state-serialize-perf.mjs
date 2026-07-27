/**
 * Measure Electron IPC cost of shipping parserState.CurrentEntities to the overlay.
 *
 * Replays a power.log through ReplayParser, and at each TURN change (plus end-of-game)
 * benchmarks:
 *  1. sanitizeParserStateForElectron (plain { Id, CardId, Tags } map — current Electron path)
 *  2. v8.serialize of the sanitized payload (proxy for structured-clone IPC size/time)
 *  3. v8.serialize of the raw FullEntity map (what IPC would ship without sanitizing)
 *  4. Tags readability after structuredClone (getter loss vs sanitize)
 *  5. v8.serialize of the TagsHistory arrays alone (what Plan C track 2 would reclaim,
 *     see docs/electron-memory-investigation.md)
 *  6. cumulative raw log chars fed so far (proxy for PowerLogBufferService heap cost)
 *
 * Usage (from repo root):
 *   node --import tsx test-tools/perf/electron-parser-state-serialize-perf.mjs [path/to/power.log]
 *   POWER_LOG_PERF_PATH=test-tools/non-reg/bg.log node --import tsx test-tools/perf/electron-parser-state-serialize-perf.mjs
 *
 * Defaults to test-tools/non-reg/bg.log (checked in). For worst-case BG scale use test-tools/bg.log
 * (~142 MB) or set POWER_LOG_PERF_PATH.
 *
 * ITERS (default 5) controls how many timed repetitions per sample for stable averages.
 */
import * as fs from 'fs';
import * as path from 'path';
import * as v8 from 'v8';
import { fileURLToPath, pathToFileURL } from 'url';

const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

const replayParserModule = await import(
	pathToFileURL(path.join(repoRoot, 'libs', 'power-log-parser', 'src', 'lib', 'replay-parser.ts')).href
);
const joinModule = await import(
	pathToFileURL(path.join(repoRoot, 'libs', 'power-log-parser', 'src', 'lib', 'join-wrapped-power-log-lines.ts')).href
);
const { ReplayParser } = replayParserModule.default ?? replayParserModule;
const { joinWrappedPowerLogLines } = joinModule.default ?? joinModule;

const logPath =
	process.argv[2] ?? process.env.POWER_LOG_PERF_PATH ?? path.join(repoRoot, 'test-tools', 'non-reg', 'bg.log');
const ITERS = Math.max(1, parseInt(process.env.ITERS ?? '5', 10) || 5);

if (!fs.existsSync(logPath)) {
	console.error(`Power log not found: ${logPath}`);
	process.exit(1);
}

console.debug = () => {};

/** Mirror of sanitizeParserStateForElectron — keep in sync with parser-entity-utils.ts */
function getEntityTags(entity) {
	if (!entity) return undefined;
	if (entity.Tags) return entity.Tags;
	return entity._tags;
}

function sanitizeEntityForElectron(entity) {
	const tags = getEntityTags(entity) ?? [];
	return {
		Id: entity.Id,
		CardId: entity.CardId ?? '',
		Tags: tags.map((t) => ({ Name: t.Name, Value: t.Value })),
	};
}

function sanitizeParserStateForElectron(parserState) {
	if (!parserState) return undefined;
	const currentEntities = new Map();
	for (const [id, entity] of parserState.CurrentEntities ?? []) {
		currentEntities.set(id, sanitizeEntityForElectron(entity));
	}
	return {
		CurrentEntities: currentEntities,
		ControllerEntityMap: new Map(parserState.ControllerEntityMap ?? []),
	};
}

function rawParserStateLite(parserState) {
	return {
		CurrentEntities: parserState.CurrentEntities,
		ControllerEntityMap: parserState.ControllerEntityMap,
	};
}

function hrMs(fn) {
	const start = process.hrtime.bigint();
	const result = fn();
	const ms = Number(process.hrtime.bigint() - start) / 1e6;
	return { ms, result };
}

function bench(fn, iters) {
	// Warmup
	fn();
	let total = 0;
	let last;
	for (let i = 0; i < iters; i++) {
		const { ms, result } = hrMs(fn);
		total += ms;
		last = result;
	}
	return { avgMs: total / iters, last };
}

function trySerialize(label, value) {
	try {
		const { avgMs, last } = bench(() => v8.serialize(value), ITERS);
		return { ok: true, avgMs, bytes: last.byteLength, label };
	} catch (err) {
		return { ok: false, error: err.message, label };
	}
}

function countTags(entities) {
	let tags = 0;
	let history = 0;
	for (const e of entities.values()) {
		tags += getEntityTags(e)?.length ?? 0;
		history += e.TagsHistory?.length ?? 0;
	}
	return { tags, history };
}

function tagsHistoryOnly(entities) {
	const result = [];
	for (const e of entities.values()) {
		result.push(e.TagsHistory ?? []);
	}
	return result;
}

function sampleAt(turn, gameState, cumLogChars) {
	const entities = gameState.CurrentEntities;
	const entityCount = entities.size;
	const { tags, history } = countTags(entities);

	const sanitize = bench(() => sanitizeParserStateForElectron(gameState), ITERS);
	const sanitized = sanitize.last;

	const serializeSanitized = trySerialize('sanitized', sanitized);
	const serializeRaw = trySerialize('raw', rawParserStateLite(gameState));
	const serializeHistory = trySerialize('tagsHistory', tagsHistoryOnly(entities));

	// Correctness: Tags survive clone after sanitize; raw clone loses getter
	let tagsAfterSanitizeClone = null;
	let tagsAfterRawClone = null;
	const sampleId = [...entities.keys()][Math.floor(entityCount / 2)];
	if (sampleId != null) {
		const sanitizedClone = structuredClone(sanitized);
		tagsAfterSanitizeClone = sanitizedClone.CurrentEntities.get(sampleId)?.Tags?.length ?? null;
		try {
			const rawClone = structuredClone(rawParserStateLite(gameState));
			const cloned = rawClone.CurrentEntities.get(sampleId);
			tagsAfterRawClone = {
				Tags: cloned?.Tags?.length ?? null,
				_tags: cloned?._tags?.length ?? null,
			};
		} catch (err) {
			tagsAfterRawClone = { error: err.message };
		}
	}

	return {
		turn,
		entityCount,
		tagCount: tags,
		tagsHistoryCount: history,
		cumLogChars,
		sanitizeAvgMs: sanitize.avgMs,
		serializeSanitized,
		serializeRaw,
		serializeHistory,
		tagsAfterSanitizeClone,
		tagsAfterRawClone,
	};
}

function fmtMs(ms) {
	return ms.toFixed(2).padStart(8);
}

function fmtBytes(bytes) {
	if (bytes == null) return '       n/a';
	if (bytes < 1024) return `${bytes} B`.padStart(10);
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`.padStart(10);
	return `${(bytes / (1024 * 1024)).toFixed(2)} MB`.padStart(10);
}

const rawLines = fs.readFileSync(logPath, 'utf8').split(/\r?\n/);
const parser = new ReplayParser();
parser.onGameEvent = () => {};
parser.Init();
const seed = parser.ExtractGameSeed(rawLines);
const normalized = joinWrappedPowerLogLines(rawLines);
console.log(`Parsing ${normalized.length} lines from ${logPath} (ITERS=${ITERS})`);

const flush = () => {
	parser.State.GSState.NodeParser.ClearQueue();
	parser.State.PTLState.NodeParser.ClearQueue();
};

const samples = [];
let turn = 0;
let cumLogChars = 0;

const maybeSample = (t) => {
	flush();
	const gs = parser.State.PTLState.GameState ?? parser.State.GSState.GameState;
	if (!gs?.CurrentEntities?.size) return;
	samples.push(sampleAt(t, gs, cumLogChars));
};

for (let i = 0; i < normalized.length; i++) {
	const line = normalized[i];
	cumLogChars += line.length;
	parser.ReadLine(line, seed, i);
	if (i % 500 === 499) flush();
	if (line.includes('GameState') && line.includes('tag=TURN value=')) {
		const m = /TAG_CHANGE Entity=GameEntity tag=TURN value=(\d+)/.exec(line);
		if (m) {
			maybeSample(turn);
			turn = parseInt(m[1], 10);
		}
	}
}
flush();
maybeSample(turn);

console.log('');
console.log(
	'turn  entities    tags  histTags    logChars  sanitizeMs  serSanMs   serSanSize   serRawMs   serRawSize   histSize  tagsOk',
);
for (const s of samples) {
	const rawMs = s.serializeRaw.ok ? fmtMs(s.serializeRaw.avgMs) : '    FAIL'.padStart(8);
	const rawSz = s.serializeRaw.ok ? fmtBytes(s.serializeRaw.bytes) : '      FAIL';
	const sanMs = s.serializeSanitized.ok ? fmtMs(s.serializeSanitized.avgMs) : '    FAIL';
	const sanSz = s.serializeSanitized.ok ? fmtBytes(s.serializeSanitized.bytes) : '      FAIL';
	const histSz = s.serializeHistory.ok ? fmtBytes(s.serializeHistory.bytes) : '      FAIL';
	const tagsOk = s.tagsAfterSanitizeClone != null && s.tagsAfterSanitizeClone > 0 ? 'yes' : 'NO';
	console.log(
		String(s.turn).padStart(4),
		String(s.entityCount).padStart(9),
		String(s.tagCount).padStart(8),
		String(s.tagsHistoryCount).padStart(9),
		fmtBytes(s.cumLogChars),
		fmtMs(s.sanitizeAvgMs),
		sanMs,
		sanSz,
		rawMs,
		rawSz,
		histSz,
		tagsOk.padStart(6),
	);
}

const last = samples[samples.length - 1];
if (last) {
	console.log('');
	console.log('=== end-of-game summary ===');
	console.log(`entities: ${last.entityCount}, tags: ${last.tagCount}, TagsHistory entries: ${last.tagsHistoryCount}`);
	console.log(`sanitize (avg of ${ITERS}): ${last.sanitizeAvgMs.toFixed(2)} ms`);
	if (last.serializeSanitized.ok) {
		console.log(
			`v8.serialize sanitized: ${last.serializeSanitized.avgMs.toFixed(2)} ms, ${fmtBytes(last.serializeSanitized.bytes).trim()}`,
		);
	}
	if (last.serializeRaw.ok) {
		console.log(
			`v8.serialize raw:       ${last.serializeRaw.avgMs.toFixed(2)} ms, ${fmtBytes(last.serializeRaw.bytes).trim()}`,
		);
		const ratio = last.serializeRaw.bytes / last.serializeSanitized.bytes;
		console.log(`raw/sanitized size ratio: ${ratio.toFixed(1)}x`);
	} else {
		console.log(`v8.serialize raw: FAILED (${last.serializeRaw.error})`);
	}
	if (last.serializeHistory.ok) {
		console.log(
			`v8.serialize TagsHistory only: ${last.serializeHistory.avgMs.toFixed(2)} ms, ${fmtBytes(last.serializeHistory.bytes).trim()} ` +
				'(what a latest-value-per-tag map would reclaim, Plan C track 2)',
		);
	}
	console.log(
		`cumulative log chars fed: ${fmtBytes(last.cumLogChars).trim()} ` +
			'(PowerLogBufferService heap proxy; V8 strings are ~2 bytes/char in memory)',
	);
	console.log(`structuredClone sanitized sample Tags length: ${last.tagsAfterSanitizeClone}`);
	console.log(`structuredClone raw sample Tags/_tags:`, last.tagsAfterRawClone);
	console.log('');
	console.log(
		'Note: Electron IPC uses structured clone (similar cost to v8.serialize). ' +
			'Facade transform also runs DeckState/BattlegroundsState createForElectron (not measured here). ' +
			'auditTime(500) caps overlay emits to ~2/s, so end-game sanitize cost ≈ above ms × 2/s on main.',
	);
}
