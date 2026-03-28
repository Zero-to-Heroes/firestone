import * as fs from 'fs';
import * as path from 'path';

const CSHARP_DIR = path.join(__dirname, 'golden-xml', 'csharp');
const TS_DIR = path.join(__dirname, 'golden-xml', 'typescript');

function normalize(xml: string): string {
	return (
		xml
			// Remove XML namespace declarations from C# output
			.replace(/ xmlns:xsi="[^"]*"/g, '')
			.replace(/ xmlns:xsd="[^"]*"/g, '')
			// Remove all whitespace between tags (normalize formatting)
			.replace(/>\s+</g, '><')
			// Normalize timestamps: strip trailing digits beyond 6 fractional digits, and normalize hours to mod-24
			.replace(/ts="(\d+):(\d+):(\d+)\.(\d+)"/g, (_match, h, m, s, frac) => {
				const normalizedHour = String(parseInt(h, 10) % 24).padStart(2, '0');
				const normalizedFrac = frac.slice(0, 6);
				return `ts="${normalizedHour}:${m}:${s}.${normalizedFrac}"`;
			})
			// Remove empty/zero timestamps (C# emits ts="00:00:00.000000", TS omits them)
			.replace(/ ts="00:00:00\.000000"/g, '')
			// Remove default attribute values that C# omits via [DefaultValue] but TS always emits
			.replace(/ index="-1"/g, '')
			.replace(/ effectIndex="-1"/g, '')
			.replace(/ target="0"/g, '')
			.replace(/ suboption="-1"/g, '')
			// Remove empty defChange (C# may omit it, TS emits defChange="")
			.replace(/ defChange=""/g, '')
			// Remove InitialName elements (C# XmlSerializer emits this, TS doesn't)
			.replace(/<InitialName>[^<]*<\/InitialName>/g, '')
			// Remove index="0" on Block elements (C# parser sets Index=0, TS parser leaves at -1)
			.replace(/ index="0"/g, '')
			// Remove leading/trailing whitespace
			.trim()
	);
}

const csharpFiles = fs
	.readdirSync(CSHARP_DIR)
	.filter((f) => f.endsWith('.xml'))
	.sort();
const tsFiles = fs
	.readdirSync(TS_DIR)
	.filter((f) => f.endsWith('.xml'))
	.sort();

console.log(`C# files: ${csharpFiles.length}, TS files: ${tsFiles.length}`);

const allNames = new Set([...csharpFiles, ...tsFiles]);
let identical = 0;
let different = 0;
let missing = 0;

const diffCategories: Record<string, number> = {};

for (const file of [...allNames].sort()) {
	const csharpPath = path.join(CSHARP_DIR, file);
	const tsPath = path.join(TS_DIR, file);

	if (!fs.existsSync(csharpPath)) {
		console.log(`MISSING C#: ${file}`);
		missing++;
		continue;
	}
	if (!fs.existsSync(tsPath)) {
		console.log(`MISSING TS: ${file}`);
		missing++;
		continue;
	}

	const csharpXml = normalize(fs.readFileSync(csharpPath, 'utf8'));
	const tsXml = normalize(fs.readFileSync(tsPath, 'utf8'));

	if (csharpXml === tsXml) {
		identical++;
	} else {
		different++;
		// Find ALL differences (up to 5 per file)
		let diffs = 0;
		let ci = 0,
			ti = 0;
		const maxDiffs = 3;

		while (ci < csharpXml.length && ti < tsXml.length && diffs < maxDiffs) {
			if (csharpXml[ci] === tsXml[ti]) {
				ci++;
				ti++;
				continue;
			}
			diffs++;

			const cContext = csharpXml.slice(Math.max(0, ci - 30), ci + 80);
			const tContext = tsXml.slice(Math.max(0, ti - 30), ti + 80);

			if (diffs === 1) {
				console.log(`\nDIFF: ${file} (C#=${csharpXml.length}, TS=${tsXml.length})`);
			}
			console.log(`  #${diffs} at C#:${ci}/TS:${ti}:`);
			console.log(`    C#: ...${cContext}...`);
			console.log(`    TS: ...${tContext}...`);

			// Try to re-sync by finding the next common sequence
			const syncLen = 20;
			let foundSync = false;
			for (let offset = 1; offset < 200; offset++) {
				const cSlice = csharpXml.slice(ci + offset, ci + offset + syncLen);
				const tIdx = tsXml.indexOf(cSlice, ti);
				if (tIdx >= 0 && cSlice.length === syncLen) {
					ci = ci + offset;
					ti = tIdx;
					foundSync = true;
					break;
				}
				const tSlice = tsXml.slice(ti + offset, ti + offset + syncLen);
				const cIdx = csharpXml.indexOf(tSlice, ci);
				if (cIdx >= 0 && tSlice.length === syncLen) {
					ci = cIdx;
					ti = ti + offset;
					foundSync = true;
					break;
				}
			}
			if (!foundSync) {
				console.log(`    (could not re-sync)`);
				break;
			}
		}
		if (diffs >= maxDiffs) {
			console.log(`  (${maxDiffs}+ diffs, stopping)`);
		}
	}
}

console.log(`\n=== Summary ===`);
console.log(`Identical: ${identical}`);
console.log(`Different: ${different}`);
console.log(`Missing:   ${missing}`);
