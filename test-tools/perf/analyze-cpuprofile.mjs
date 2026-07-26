/**
 * Aggregate a .cpuprofile: top functions by SELF time and by INCLUSIVE (total) time.
 * Usage: node test-tools/perf/analyze-cpuprofile.mjs <profile.cpuprofile> [nameFilterRegex]
 */
import * as fs from 'fs';

const profilePath = process.argv[2];
const filter = process.argv[3] ? new RegExp(process.argv[3]) : null;
const p = JSON.parse(fs.readFileSync(profilePath, 'utf8'));

const nodes = new Map(p.nodes.map((n) => [n.id, n]));
const parentOf = new Map();
for (const n of p.nodes) {
	for (const c of n.children ?? []) {
		parentOf.set(c, n.id);
	}
}

// Self time per node from samples + timeDeltas
const selfUs = new Map();
let totalUs = 0;
for (let i = 0; i < p.samples.length; i++) {
	const dt = p.timeDeltas[i] || 0;
	totalUs += dt;
	selfUs.set(p.samples[i], (selfUs.get(p.samples[i]) || 0) + dt);
}

// Inclusive time: propagate self time up the parent chain
const inclusiveUs = new Map();
for (const [id, us] of selfUs) {
	let cur = id;
	const seen = new Set();
	while (cur != null && !seen.has(cur)) {
		seen.add(cur);
		inclusiveUs.set(cur, (inclusiveUs.get(cur) || 0) + us);
		cur = parentOf.get(cur);
	}
}

const label = (n) => {
	const cf = n.callFrame;
	const file = (cf.url || '').split(/[\\/]/).slice(-1)[0];
	return `${cf.functionName || '(anon)'} ${file}:${cf.lineNumber + 1}`;
};

// Group by label (same function may appear as several nodes)
const groupBy = (map) => {
	const grouped = new Map();
	for (const [id, us] of map) {
		const key = label(nodes.get(id));
		grouped.set(key, (grouped.get(key) || 0) + us);
	}
	return [...grouped.entries()].sort((a, b) => b[1] - a[1]);
};

const fmt = (us) => `${String(Math.round(us / 1000)).padStart(7)} ms ${((100 * us) / totalUs).toFixed(1).padStart(5)}%`;

console.log(`Total sampled: ${Math.round(totalUs / 1000)} ms`);
console.log('\n=== Top 35 by SELF time ===');
for (const [key, us] of groupBy(selfUs).slice(0, 35)) {
	if (filter && !filter.test(key)) continue;
	console.log(fmt(us), key);
}
console.log('\n=== Top 45 by INCLUSIVE time ===');
const inc = groupBy(inclusiveUs);
for (const [key, us] of inc.slice(0, 45)) {
	if (filter && !filter.test(key)) continue;
	console.log(fmt(us), key);
}
if (filter) {
	console.log(`\n=== All INCLUSIVE matching ${filter} ===`);
	for (const [key, us] of inc) {
		if (filter.test(key)) console.log(fmt(us), key);
	}
}
