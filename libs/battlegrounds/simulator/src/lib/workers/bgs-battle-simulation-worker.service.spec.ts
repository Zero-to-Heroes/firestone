import { NgZone } from '@angular/core';
import { BgsBattleInfo } from '@firestone-hs/simulate-bgs-battle/dist/bgs-battle-info';
import { SimulationResult } from '@firestone-hs/simulate-bgs-battle/dist/simulation-result';

// The real module uses import.meta (required verbatim for bundler worker detection),
// which doesn't compile under the CommonJS Jest transform
jest.mock('./create-sim-worker', () => ({ createSimWorker: jest.fn() }));
// Barrel imports pull in files that don't compile under this lib's spec tsconfig
// (e.g. window-manager.service.ts); only classes referenced at runtime are needed.
// SimRequestLane is the real implementation — its ordering IS what's under test.
jest.mock('@firestone/battlegrounds/core', () => ({
	BgsBattleSimulationExecutorService: class {},
	SimRequestLane: jest.requireActual('../../../../core/src/lib/services/simulation/sim-request-lane').SimRequestLane,
}));
jest.mock('@firestone/shared/common/service', () => ({ BugReportService: class {} }));
jest.mock('@firestone/shared/framework/core', () => ({ CardsFacadeService: class {} }));

import { BgsBattleSimulationWorkerService } from './bgs-battle-simulation-worker.service';

/**
 * Protocol tests for the persistent sim worker host (Plan F port,
 * docs/electron-memory-investigation.md): init-once cards, id-correlated
 * requests across a shared worker, error fallback, worker reuse.
 */

class FakeWorker {
	onmessage: ((ev: MessageEvent) => void) | null = null;
	onerror: ((ev: ErrorEvent) => void) | null = null;
	readonly posted: any[] = [];
	terminated = false;

	postMessage(data: any): void {
		this.posted.push(data);
	}

	terminate(): void {
		this.terminated = true;
	}

	emit(data: any): void {
		this.onmessage?.({ data } as MessageEvent);
	}
}

class TestableService extends BgsBattleSimulationWorkerService {
	readonly workers: FakeWorker[] = [];

	protected override createWorkerInstance(): Worker {
		const worker = new FakeWorker();
		this.workers.push(worker);
		return worker as unknown as Worker;
	}
}

const fakeZone = {
	run: (fn: () => void) => fn(),
	runOutsideAngular: (fn: () => void) => fn(),
} as unknown as NgZone;

const fakeCards = {
	getService: () => ({ fake: 'cards' }),
	getCards: () => [{}],
} as any;

const fakeBugService = { submitAutomatedReport: jest.fn() } as any;

const battleInfo = { options: { numberOfSimulations: 800 } } as BgsBattleInfo;
const prefs = { bgsSimulatorNumberOfSims: 2500 } as any;

describe('BgsBattleSimulationWorkerService (persistent worker)', () => {
	let service: TestableService;

	beforeEach(() => {
		service = new TestableService(fakeCards, fakeBugService, fakeZone);
	});

	it('initializes the worker once and reuses it across sims (one sim in flight at a time)', () => {
		const results1: (SimulationResult | null)[] = [];
		const results2: (SimulationResult | null)[] = [];
		service.simulateLocalBattle(battleInfo, prefs, false, (r) => results1.push(r));
		service.simulateLocalBattle(battleInfo, prefs, false, (r) => results2.push(r));

		expect(service.workers.length).toBe(1);
		const worker = service.workers[0];
		// init + only the FIRST sim: the second waits in the lane until the first completes
		expect(worker.posted[0]).toEqual({ type: 'init', cards: { fake: 'cards' } });
		expect(worker.posted.length).toBe(2);
		expect(worker.posted[1].type).toBe('simulateBattle');

		worker.emit({ id: worker.posted[1].id, done: true, result: JSON.stringify({ wonPercent: 40 }) });
		expect(results1).toEqual([{ wonPercent: 40 }]);

		// Now the second sim is in the worker, on the same worker instance
		expect(worker.posted.length).toBe(3);
		expect(worker.posted[2].type).toBe('simulateBattle');
		expect(worker.posted[2].id).not.toBe(worker.posted[1].id);
		worker.emit({ id: worker.posted[2].id, done: true, result: JSON.stringify({ wonPercent: 60 }) });
		expect(results2).toEqual([{ wonPercent: 60 }]);
		expect(worker.terminated).toBe(false);
	});

	it('runs the newest queued sim first (catch-up burst does not starve the live battle)', () => {
		const finished: string[] = [];
		const start = (label: string) =>
			service.simulateLocalBattle(battleInfo, prefs, false, (r) => {
				if (r) {
					finished.push(label);
				}
			});
		// Simulates a log catch-up: three past fights fire sims back-to-back
		start('stale-1');
		start('stale-2');
		start('live');

		const worker = service.workers[0];
		const completeCurrent = () => {
			const request = worker.posted[worker.posted.length - 1];
			worker.emit({ id: request.id, done: true, result: JSON.stringify({ wonPercent: 50 }) });
		};

		// stale-1 was already in the worker when the others arrived; after it, the
		// most recent request (the live battle) runs before the older stale one
		expect(worker.posted.length).toBe(2);
		completeCurrent();
		completeCurrent();
		completeCurrent();
		expect(finished).toEqual(['stale-1', 'live', 'stale-2']);
		// All sims eventually ran, one at a time
		expect(worker.posted.filter((m) => m.type === 'simulateBattle').length).toBe(3);
	});

	it('applies the requested sim count and outcome samples flag', () => {
		service.simulateLocalBattle(battleInfo, prefs, true, () => void 0);
		const request = service.workers[0].posted[1];
		expect(request.battleInfo.options.numberOfSimulations).toBe(800);
		expect(request.battleInfo.options.includeOutcomeSamples).toBe(true);
	});

	it('delivers intermediate results before the final one', () => {
		const results: (SimulationResult | null)[] = [];
		service.simulateLocalBattle(battleInfo, prefs, false, (r) => results.push(r));
		const worker = service.workers[0];
		const id = worker.posted[1].id;

		worker.emit({ id, done: false, result: JSON.stringify({ wonPercent: 10 }) });
		worker.emit({ id, done: true, result: JSON.stringify({ wonPercent: 55 }) });
		expect(results).toEqual([{ wonPercent: 10 }, { wonPercent: 55 }]);
	});

	it('resolves null when the worker reports a sim exception', () => {
		const results: (SimulationResult | null)[] = [];
		service.simulateLocalBattle(battleInfo, prefs, false, (r) => results.push(r));
		const worker = service.workers[0];
		worker.emit({ id: worker.posted[1].id, done: true, result: null });
		expect(results).toEqual([null]);
		expect(fakeBugService.submitAutomatedReport).toHaveBeenCalled();
	});

	it('fails in-flight sims on worker error and respawns on next use', () => {
		const results: (SimulationResult | null)[] = [];
		service.simulateLocalBattle(battleInfo, prefs, false, (r) => results.push(r));
		const firstWorker = service.workers[0];
		firstWorker.onerror?.({ message: 'boom' } as ErrorEvent);
		expect(results).toEqual([null]);
		expect(firstWorker.terminated).toBe(true);

		service.simulateLocalBattle(battleInfo, prefs, false, (r) => results.push(r));
		expect(service.workers.length).toBe(2);
		const secondWorker = service.workers[1];
		expect(secondWorker.posted[0].type).toBe('init');
		secondWorker.emit({ id: secondWorker.posted[1].id, done: true, result: JSON.stringify({ wonPercent: 50 }) });
		expect(results).toEqual([null, { wonPercent: 50 }]);
	});

	it('releases the worker after the idle TTL and re-inits on next sim', () => {
		jest.useFakeTimers();
		try {
			service.simulateLocalBattle(battleInfo, prefs, false, () => void 0);
			const worker = service.workers[0];
			worker.emit({ id: worker.posted[1].id, done: true, result: JSON.stringify({ wonPercent: 50 }) });

			jest.advanceTimersByTime(5 * 60 * 1000 + 1);
			expect(worker.terminated).toBe(true);

			service.simulateLocalBattle(battleInfo, prefs, false, () => void 0);
			expect(service.workers.length).toBe(2);
		} finally {
			jest.useRealTimers();
		}
	});
});
