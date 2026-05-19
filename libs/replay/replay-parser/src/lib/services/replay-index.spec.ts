import * as fs from 'fs';
import * as path from 'path';
import { buildReplayIndex } from './replay-index-builder';

const FIXTURES_DIR = path.join(__dirname, '..', '..', '..', '..', '..', '..', 'test-tools', 'replay-perf');

describe('ReplayIndexBuilder', () => {
	it('builds index for standard ranked replay (072420fa)', () => {
		const xmlPath = path.join(FIXTURES_DIR, 'standard-072420fa.xml');
		const xml = fs.readFileSync(xmlPath, 'utf8');
		const index = buildReplayIndex(xml);

		expect(index.turnChunks.length).toBeGreaterThan(0);
		expect(index.entityCardId.size).toBeGreaterThan(0);
		expect(index.totalDuration).toBeGreaterThan(0);
		expect(index.meta?.gameType).toBeDefined();
		console.log('[replay-perf][standard] chunks=', index.turnChunks.length, 'duration=', index.totalDuration);
	}, 60_000);

	it('builds index for BG replay (ebff9f3e)', () => {
		const xmlPath = path.join(FIXTURES_DIR, 'bg-ebff9f3e.xml');
		const xml = fs.readFileSync(xmlPath, 'utf8');
		const index = buildReplayIndex(xml);

		expect(index.turnChunks.length).toBeGreaterThan(10);
		expect(index.entityCardId.size).toBeGreaterThan(0);
		expect(index.totalDuration).toBeGreaterThan(0);
		console.log('[replay-perf][bg] chunks=', index.turnChunks.length, 'duration=', index.totalDuration);
	}, 120_000);
});
