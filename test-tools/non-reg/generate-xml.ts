import * as fs from 'fs';
import * as path from 'path';
import { xmlFromReplay } from '../../libs/power-log-parser/src/lib/replay-converter';
import { ReplayParser } from '../../libs/power-log-parser/src/lib/replay-parser';

const TEST_DATA_DIR = path.join(__dirname, '..', 'libs', 'power-log-parser', 'src', 'test-data');
const OUTPUT_DIR = path.join(__dirname, 'golden-xml', 'typescript');

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const logFiles = fs
	.readdirSync(TEST_DATA_DIR)
	.filter((f) => f.endsWith('.log'))
	.sort();

console.log(`Found ${logFiles.length} log files`);

let success = 0;
let fail = 0;

for (const logFile of logFiles) {
	const name = logFile.replace('.log', '');
	try {
		const lines = fs.readFileSync(path.join(TEST_DATA_DIR, logFile), 'utf8').split('\n');
		const parser = new ReplayParser();
		const replay = parser.FromString(lines);
		const xml = xmlFromReplay(replay);
		fs.writeFileSync(path.join(OUTPUT_DIR, `${name}.xml`), xml, 'utf8');
		success++;
	} catch (e) {
		console.error(`FAILED: ${name} - ${(e as Error).message}`);
		fail++;
	}
}

console.log(`Done: ${success} succeeded, ${fail} failed`);
