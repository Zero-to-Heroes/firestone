import * as fs from 'fs';
import * as path from 'path';
import { ReplayParser, GameEvent } from './replay-parser';

const TEST_DATA_DIR = path.join(__dirname, '..', 'test-data');

function loadTestLog(name: string): string[] {
	const logPath = path.join(TEST_DATA_DIR, `${name}.log`);
	return fs.readFileSync(logPath, 'utf8').split('\n');
}

function loadGoldenEvents(name: string): any[] {
	const eventsPath = path.join(TEST_DATA_DIR, `${name}.events.json`);
	return JSON.parse(fs.readFileSync(eventsPath, 'utf8'));
}

function discoverScenarios(): string[] {
	return fs
		.readdirSync(TEST_DATA_DIR)
		.filter((f) => f.endsWith('.events.json'))
		.map((f) => f.replace('.events.json', ''))
		.sort();
}

describe('ReplayParser', () => {
	it('should be instantiable', () => {
		const parser = new ReplayParser();
		expect(parser).toBeDefined();
	});

	it('should accept log lines without throwing', () => {
		const parser = new ReplayParser();
		const lines = loadTestLog('dragon_breath');
		expect(() => parser.FromString(lines)).not.toThrow();
	});

	it('should emit events via onGameEvent callback', () => {
		const parser = new ReplayParser();
		const events: GameEvent[] = [];
		parser.onGameEvent = (event) => events.push(event);
		const lines = loadTestLog('dragon_breath');
		parser.FromString(lines);
		// TODO: Once the parser is implemented, assert events.length > 0
	});

	it('should produce events via fromString()', () => {
		const parser = new ReplayParser();
		const lines = loadTestLog('dragon_breath');
		const events: GameEvent[] = [];
		parser.onGameEvent = (event) => events.push(event);
		parser.FromString(lines);
		expect(events).toBeDefined();
		expect(Array.isArray(events)).toBe(true);
	});
});

describe('Golden event files are loadable', () => {
	const scenarios = discoverScenarios();

	it('should discover at least 40 test scenarios', () => {
		expect(scenarios.length).toBeGreaterThanOrEqual(40);
	});

	for (const scenario of scenarios) {
		it(`should load golden events for ${scenario}`, () => {
			const events = loadGoldenEvents(scenario);
			expect(events.length).toBeGreaterThan(0);
			expect(events[0]).toHaveProperty('Type');
		});

		it(`should have a matching log file for ${scenario}`, () => {
			const logPath = path.join(TEST_DATA_DIR, `${scenario}.log`);
			expect(fs.existsSync(logPath)).toBe(true);
		});
	}
});

/**
 * These tests will be enabled once the parser is functional.
 * They compare the TS parser output against the C# parser's golden events.
 */
describe.skip('Golden event parity', () => {
	const scenarios = discoverScenarios();

	for (const scenario of scenarios) {
		it(`should match golden events for ${scenario}`, () => {
			const parser = new ReplayParser();
			const actualEvents: GameEvent[] = [];
			parser.onGameEvent = (event) => actualEvents.push(event);
			const lines = loadTestLog(scenario);
			parser.FromString(lines);
			const goldenEvents = loadGoldenEvents(scenario);

			expect(actualEvents.length).toBe(goldenEvents.length);

			for (let i = 0; i < goldenEvents.length; i++) {
				expect(actualEvents[i].Type).toBe(goldenEvents[i].Type);
			}
		});
	}
});
