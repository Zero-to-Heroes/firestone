/**
 * Diff two V8 heapsnapshots by constructor/group self-size.
 * Usage: node --max-old-space-size=8192 test-tools/perf/diff-heapsnapshots.mjs <older.heapsnapshot> <newer.heapsnapshot> [topN]
 */
import * as fs from 'fs';

const olderPath = process.argv[2];
const newerPath = process.argv[3];
const topN = parseInt(process.argv[4] ?? '40', 10);
if (!olderPath || !newerPath) {
	console.error('Usage: node diff-heapsnapshots.mjs <older> <newer> [topN]');
	process.exit(1);
}

function summarize(file) {
	console.log(`loading ${file} (${(fs.statSync(file).size / 1024 / 1024).toFixed(0)} MB)...`);
	const snap = JSON.parse(fs.readFileSync(file, 'utf8'));
	const meta = snap.snapshot.meta;
	const nodeFields = meta.node_fields;
	const nodeTypes = meta.node_types[nodeFields.indexOf('type')];
	const F = nodeFields.length;
	const TYPE = nodeFields.indexOf('type');
	const NAME = nodeFields.indexOf('name');
	const SELF = nodeFields.indexOf('self_size');
	const nodes = snap.nodes;
	const strings = snap.strings;
	const byGroup = new Map();
	let total = 0;
	for (let i = 0; i < nodes.length; i += F) {
		const type = nodeTypes[nodes[i + TYPE]];
		const self = nodes[i + SELF];
		total += self;
		const name =
			type === 'string' || type === 'concatenated string' || type === 'sliced string'
				? `(${type})`
				: strings[nodes[i + NAME]];
		const key = `${type} ${name}`;
		const g = byGroup.get(key) ?? { size: 0, count: 0 };
		g.size += self;
		g.count++;
		byGroup.set(key, g);
	}
	return { total, byGroup };
}

const older = summarize(olderPath);
const newer = summarize(newerPath);
const mb = (b) => (b / 1024 / 1024).toFixed(2).padStart(8);
console.log(`\nolder total ${mb(older.total)} MB → newer ${mb(newer.total)} MB  (Δ ${mb(newer.total - older.total)} MB)`);

const keys = new Set([...older.byGroup.keys(), ...newer.byGroup.keys()]);
const deltas = [];
for (const key of keys) {
	const o = older.byGroup.get(key) ?? { size: 0, count: 0 };
	const n = newer.byGroup.get(key) ?? { size: 0, count: 0 };
	const dSize = n.size - o.size;
	const dCount = n.count - o.count;
	if (dSize === 0 && dCount === 0) continue;
	deltas.push({ key, dSize, dCount, nSize: n.size, oSize: o.size });
}
deltas.sort((a, b) => b.dSize - a.dSize);

console.log(`\n=== top ${topN} growers by Δ self size ===`);
for (const d of deltas.slice(0, topN)) {
	console.log(
		`${mb(d.dSize)} MB  countΔ ${String(d.dCount).padStart(8)}  (${mb(d.oSize)} → ${mb(d.nSize)})  ${d.key.slice(0, 100)}`,
	);
}
console.log(`\n=== top 15 shrinkers ===`);
for (const d of [...deltas].sort((a, b) => a.dSize - b.dSize).slice(0, 15)) {
	console.log(
		`${mb(d.dSize)} MB  countΔ ${String(d.dCount).padStart(8)}  (${mb(d.oSize)} → ${mb(d.nSize)})  ${d.key.slice(0, 100)}`,
	);
}
