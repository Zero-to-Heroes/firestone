import { SimRequestLane } from './sim-request-lane';

/**
 * The lane guards the single persistent compute worker: only one sim in flight,
 * newest request first, so a catch-up burst of stale sims can't queue minutes of
 * work ahead of the live battle's sim.
 */
describe('SimRequestLane', () => {
	it('starts the first sim immediately', () => {
		const lane = new SimRequestLane();
		const started: string[] = [];
		lane.enqueue(() => started.push('a'));
		expect(started).toEqual(['a']);
		expect(lane.pendingCount).toBe(1);
	});

	it('holds later sims until the running one completes, newest first', () => {
		const lane = new SimRequestLane();
		const started: string[] = [];
		const doneCallbacks: (() => void)[] = [];
		const enqueue = (label: string) =>
			lane.enqueue((done) => {
				started.push(label);
				doneCallbacks.push(done);
			});

		enqueue('stale-1');
		enqueue('stale-2');
		enqueue('live');
		expect(started).toEqual(['stale-1']);

		doneCallbacks[0]();
		expect(started).toEqual(['stale-1', 'live']);

		doneCallbacks[1]();
		expect(started).toEqual(['stale-1', 'live', 'stale-2']);
		doneCallbacks[2]();
		expect(lane.pendingCount).toBe(0);
	});

	it('ignores duplicate done() calls (intermediate + final responses)', () => {
		const lane = new SimRequestLane();
		const started: string[] = [];
		let firstDone: () => void = () => void 0;
		lane.enqueue((done) => {
			started.push('a');
			firstDone = done;
		});
		lane.enqueue(() => started.push('b'));

		firstDone();
		firstDone();
		expect(started).toEqual(['a', 'b']);
		expect(lane.pendingCount).toBe(1);
	});

	it('drains the queue when done() is called synchronously (immediate worker failure)', () => {
		const lane = new SimRequestLane();
		const started: string[] = [];
		lane.enqueue((done) => {
			started.push('a');
			done();
		});
		lane.enqueue((done) => {
			started.push('b');
			done();
		});
		lane.enqueue((done) => {
			started.push('c');
			done();
		});
		expect(started).toEqual(['a', 'b', 'c']);
		expect(lane.pendingCount).toBe(0);
	});
});
