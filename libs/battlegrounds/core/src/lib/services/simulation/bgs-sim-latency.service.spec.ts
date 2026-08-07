import { bgsSimLatency } from './bgs-sim-latency.service';

describe('bgsSimLatency', () => {
	beforeEach(() => {
		bgsSimLatency.reset();
	});

	it('headlines boardsVisible→kickoff and does not wait for paint', async () => {
		bgsSimLatency.markBoardsVisible('b1', performance.now());
		await new Promise((r) => setTimeout(r, 20));
		bgsSimLatency.markKickoff('b1');

		const stats = bgsSimLatency.getStats();
		expect(stats.n).toBe(1);
		expect(stats.mean).toBeGreaterThanOrEqual(15);
		expect(stats.hops.visibleToKickoff.n).toBe(1);
		expect(stats.samples[0].battleId).toBe('b1');
		expect(stats.samples[0].boardToPaintMs).toBeNull();
	});

	it('fills optional hops when result and paint arrive', async () => {
		bgsSimLatency.markBoardsVisible('b1', performance.now());
		await new Promise((r) => setTimeout(r, 10));
		bgsSimLatency.markKickoff('b1');
		await new Promise((r) => setTimeout(r, 20));
		bgsSimLatency.markFirstResult('b1');
		await new Promise((r) => setTimeout(r, 5));
		bgsSimLatency.markFirstPaint('b1');

		const stats = bgsSimLatency.getStats();
		expect(stats.n).toBe(1);
		expect(stats.hops.kickoffToFirstResult.n).toBe(1);
		expect(stats.hops.resultToPaint.n).toBe(1);
		expect(stats.hops.boardToPaint.n).toBe(1);
		expect(stats.samples[0].boardToPaintMs).toBeGreaterThanOrEqual(30);
	});

	it('uses stamped boardsVisibleAt as the start time', () => {
		const t0 = performance.now() - 500;
		bgsSimLatency.markBoardsVisible('b3', t0);
		bgsSimLatency.markKickoff('b3');
		expect(bgsSimLatency.getStats().samples[0].visibleToKickoffMs).toBeGreaterThanOrEqual(500);
	});

	it('ignores duplicate kickoff / first-result / first-paint marks', () => {
		bgsSimLatency.markBoardsVisible('b2');
		bgsSimLatency.markKickoff('b2');
		bgsSimLatency.markKickoff('b2');
		bgsSimLatency.markFirstResult('b2');
		bgsSimLatency.markFirstResult('b2');
		bgsSimLatency.markFirstPaint('b2');
		bgsSimLatency.markFirstPaint('b2');
		expect(bgsSimLatency.getStats().n).toBe(1);
	});
});
