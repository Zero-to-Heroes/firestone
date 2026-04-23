/**
 * Perf/timing sanity check for the parser-side rewind controller. This isolates the parser
 * pipeline from the Angular/TestBed stack so we can tell whether a hang in the consumer
 * non-reg suite is rooted in the parser or downstream.
 */
import * as fs from 'fs';
import * as path from 'path';
import { ReplayParser } from '../replay-parser';
import { buildRewindCardOracle } from './card-oracle';

const REWIND_LOGS = path.join(__dirname, '..', '..', '..', '..', '..', 'test-tools', 'non-reg', 'power-logs', 'rewind');

function loadCardsRef() {
	const cardsPath = process.env['HS_REFERENCE_CARDS_JSON_PATH'] ??
		path.join(__dirname, '..', '..', '..', '..', '..', '..', 'hs-reference-data', 'src', 'cards_short.json');
	if (!fs.existsSync(cardsPath)) return null;
	const cards = JSON.parse(fs.readFileSync(cardsPath, 'utf8'));
	return {
		getCard(cardId: string | null | undefined) {
			if (cardId == null) return null;
			return cards.find((c: { id: string }) => c.id === cardId) ?? null;
		},
	};
}

describe('Rewind perf sanity', () => {
	it('parses the smallest rewind log in reasonable time', () => {
		if (!fs.existsSync(REWIND_LOGS)) {
			console.warn('No rewind logs; skipping perf check');
			return;
		}
		const cardsRef = loadCardsRef();
		if (!cardsRef) {
			console.warn('No cards_short.json; skipping perf check');
			return;
		}
		const oracle = buildRewindCardOracle(cardsRef as unknown as Parameters<typeof buildRewindCardOracle>[0]);
		const logName = process.env['PERF_LOG'] ?? 'rewind_opp_first.log';
		const logPath = path.join(REWIND_LOGS, logName);
		const lines = fs.readFileSync(logPath, 'utf8').split('\n');
		console.log('[perf] parsing', lines.length, 'lines with oracle');

		const parser = new ReplayParser(oracle);
		let eventCount = 0;
		const eventTypes: string[] = [];
		parser.onGameEvent = (e) => {
			eventCount++;
			if (e.Type.includes('REWIND')) eventTypes.push(e.Type);
		};
		if (process.env['PERF_DEBUG']) {
			(parser as any)._debugHook = (kind: string, info: unknown) => {
				console.log(`[rewind-debug] ${kind}`, info);
			};
		}

		const t0 = Date.now();
		try {
			parser.FromString(lines);
		} catch (e) {
			const dt = Date.now() - t0;
			console.log(`[perf] threw after ${dt}ms, ${eventCount} events`, (e as Error).message);
			console.log(`[perf] rewind events seen:`, eventTypes);
			throw e;
		}
		const dt = Date.now() - t0;
		console.log(`[perf] parsed in ${dt}ms, ${eventCount} events emitted`);
		console.log(`[perf] rewind events seen:`, eventTypes);
	}, 300_000);
});
