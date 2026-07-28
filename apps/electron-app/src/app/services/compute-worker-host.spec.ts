/**
 * Tests the compute worker host lifecycle (docs/electron-memory-investigation.md,
 * Plans F/H + the idle-release RAM follow-up): spawn-once with an init cards clone,
 * request correlation, failure fallback, and the idle TTL that releases the
 * ~130 MB resident worker when no request has come in and Hearthstone isn't
 * running (keep-alive check false).
 */
import { ComputeWorkerHost } from './compute-worker-host';

class FakeWorker {
	public posted: any[] = [];
	public terminated = false;
	private listeners = new Map<string, ((...args: any[]) => void)[]>();

	on(event: string, cb: (...args: any[]) => void) {
		const cbs = this.listeners.get(event) ?? [];
		cbs.push(cb);
		this.listeners.set(event, cbs);
	}

	postMessage(msg: any) {
		this.posted.push(msg);
	}

	terminate() {
		this.terminated = true;
	}

	emit(event: string, ...args: any[]) {
		for (const cb of this.listeners.get(event) ?? []) {
			cb(...args);
		}
	}
}

const spawnedWorkers: FakeWorker[] = [];

jest.mock('worker_threads', () => ({
	Worker: jest.fn().mockImplementation(() => {
		const worker = new FakeWorker();
		spawnedWorkers.push(worker);
		return worker;
	}),
}));

const IDLE_RELEASE_MS = 5 * 60 * 1000;
const cards = { fakeCardsDb: true };

const flushMicrotasks = async (rounds = 5) => {
	for (let i = 0; i < rounds; i++) {
		await Promise.resolve();
	}
};

describe('ComputeWorkerHost', () => {
	let host: ComputeWorkerHost;
	let keepAlive: jest.Mock;

	beforeEach(() => {
		jest.useFakeTimers();
		spawnedWorkers.length = 0;
		host = new ComputeWorkerHost(() => cards);
		keepAlive = jest.fn().mockResolvedValue(false);
		host.setKeepAliveCheck(keepAlive);
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it('spawns one worker, sends the cards init, and reuses it across requests', async () => {
		host.prewarm();
		expect(spawnedWorkers.length).toBe(1);
		expect(spawnedWorkers[0].posted[0]).toEqual({ type: 'init', cards: cards });

		const first = host.request({ type: 'op' });
		const second = host.request({ type: 'op' });
		const worker = spawnedWorkers[0];
		// init + 2 requests, correlated by id
		expect(worker.posted.length).toBe(3);
		worker.emit('message', { id: worker.posted[1].id, ok: true, result: 'a', done: true });
		worker.emit('message', { id: worker.posted[2].id, ok: true, result: 'b', done: true });
		expect((await first)?.result).toBe('a');
		expect((await second)?.result).toBe('b');
		expect(spawnedWorkers.length).toBe(1);
	});

	it('releases the worker after the idle TTL when the keep-alive check is false', async () => {
		host.prewarm();
		const worker = spawnedWorkers[0];

		jest.advanceTimersByTime(IDLE_RELEASE_MS + 1);
		await flushMicrotasks();

		expect(keepAlive).toHaveBeenCalled();
		expect(worker.terminated).toBe(true);

		// Next request transparently respawns (with a fresh cards init)
		const pending = host.request({ type: 'op' });
		expect(spawnedWorkers.length).toBe(2);
		const respawned = spawnedWorkers[1];
		expect(respawned.posted[0]).toEqual({ type: 'init', cards: cards });
		respawned.emit('message', { id: respawned.posted[1].id, ok: true, result: 'x', done: true });
		expect((await pending)?.result).toBe('x');
	});

	it('keeps the worker alive while the keep-alive check is true, then releases once it turns false', async () => {
		keepAlive.mockResolvedValue(true);
		host.prewarm();
		const worker = spawnedWorkers[0];

		jest.advanceTimersByTime(IDLE_RELEASE_MS + 1);
		await flushMicrotasks();
		expect(worker.terminated).toBe(false);

		keepAlive.mockResolvedValue(false);
		jest.advanceTimersByTime(IDLE_RELEASE_MS + 1);
		await flushMicrotasks();
		expect(worker.terminated).toBe(true);
	});

	it('does not release while a request is in flight, and re-arms after it completes', async () => {
		host.prewarm();
		const worker = spawnedWorkers[0];
		// timeout longer than the idle TTL, so the request is still in flight when the idle timer fires
		const pending = host.request({ type: 'op' }, 2 * IDLE_RELEASE_MS);

		jest.advanceTimersByTime(IDLE_RELEASE_MS + 1);
		await flushMicrotasks();
		expect(worker.terminated).toBe(false);

		worker.emit('message', { id: worker.posted[1].id, ok: true, result: 'a', done: true });
		expect((await pending)?.result).toBe('a');

		jest.advanceTimersByTime(IDLE_RELEASE_MS + 1);
		await flushMicrotasks();
		expect(worker.terminated).toBe(true);
	});

	it('fails in-flight requests on worker error and respawns on next use', async () => {
		host.prewarm();
		const worker = spawnedWorkers[0];
		const pending = host.request({ type: 'op' });

		worker.emit('error', new Error('boom'));
		expect(await pending).toBeNull();
		expect(worker.terminated).toBe(true);

		host.prewarm();
		expect(spawnedWorkers.length).toBe(2);
	});
});
