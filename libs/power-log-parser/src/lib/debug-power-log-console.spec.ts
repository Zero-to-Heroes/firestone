import * as fs from 'fs';
import * as path from 'path';
import { ReplayParser } from './replay-parser';

/** Workspace root: .../firestone (four levels up from this file). */
const WORKSPACE_ROOT = path.join(__dirname, '..', '..', '..', '..');
const DEFAULT_POWER_LOG = path.join(WORKSPACE_ROOT, 'test-tools', 'power.log');

function resolvePowerLogPath(): string {
	return process.env.POWER_LOG_DEBUG_PATH?.trim() || DEFAULT_POWER_LOG;
}

describe('debug: power.log → console (attach debugger here)', () => {
	jest.setTimeout(300_000);

	it('parses test-tools/power.log and prints all game events', () => {
		const logPath = resolvePowerLogPath();
		const fullJson = process.env.POWER_LOG_DEBUG_FULL === '1';
		if (!fs.existsSync(logPath)) {
			throw new Error(`Power log not found: ${logPath}`);
		}
		const raw = fs.readFileSync(logPath, 'utf8');
		const lines = raw.split(/\r?\n/);

		const parser = new ReplayParser();
		let index = 0;
		parser.onGameEvent = (event) => {
			index += 1;
			if (fullJson) {
				console.log(`[event ${index}]`, JSON.stringify(event));
			} else {
				console.log(`[event ${index}]`, event.Type, event.Value);
			}
		};

		parser.FromString(lines);

		console.log(`Done. ${index} events from ${logPath}${fullJson ? '' : ' (set POWER_LOG_DEBUG_FULL=1 for JSON lines)'}`);
	});
});
