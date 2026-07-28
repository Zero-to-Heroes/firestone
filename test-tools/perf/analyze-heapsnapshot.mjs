/**
 * Summarize a V8 .heapsnapshot: self size grouped by node type/constructor, plus the
 * biggest duplicated strings. Complements the FS_ELECTRON_MEM_HEAPSNAPSHOT trigger in
 * memory-instrumentation.service.ts (docs/electron-memory-investigation.md, Plan C scoping).
 *
 * Usage: node --max-old-space-size=8192 test-tools/perf/analyze-heapsnapshot.mjs <file.heapsnapshot> [topN]
 */
import * as fs from 'fs';

const file = process.argv[2];
const topN = parseInt(process.argv[3] ?? '40', 10);
if (!file || !fs.existsSync(file)) {
	console.error('Usage: node analyze-heapsnapshot.mjs <file.heapsnapshot> [topN]');
	process.exit(1);
}

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

const byGroup = new Map(); // "type name" -> { size, count }
const stringSizes = new Map(); // string name idx -> { size, count } (for type=string)
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
	if (type === 'string' && self >= 1024) {
		const nameIdx = nodes[i + NAME];
		const s = stringSizes.get(nameIdx) ?? { size: 0, count: 0 };
		s.size += self;
		s.count++;
		stringSizes.set(nameIdx, s);
	}
}

const mb = (b) => (b / 1024 / 1024).toFixed(1).padStart(8);
console.log(`\ntotal self size: ${mb(total)} MB, ${nodes.length / F} nodes`);
console.log(`\n=== top ${topN} groups by self size ===`);
for (const [key, g] of [...byGroup.entries()].sort((a, b) => b[1].size - a[1].size).slice(0, topN)) {
	console.log(`${mb(g.size)} MB  x${String(g.count).padStart(8)}  ${key.slice(0, 120)}`);
}

console.log(`\n=== top 25 large strings (>=1KB each) by total size ===`);
for (const [nameIdx, s] of [...stringSizes.entries()].sort((a, b) => b[1].size - a[1].size).slice(0, 25)) {
	const preview = strings[nameIdx].slice(0, 140).replace(/\s+/g, ' ');
	console.log(`${mb(s.size)} MB  x${String(s.count).padStart(6)}  ${preview}`);
}
