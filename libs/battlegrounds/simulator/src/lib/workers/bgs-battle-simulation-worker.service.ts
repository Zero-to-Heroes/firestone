import { Injectable, NgZone } from '@angular/core';
import { BgsBattleInfo } from '@firestone-hs/simulate-bgs-battle/dist/bgs-battle-info';
import { SimulationResult } from '@firestone-hs/simulate-bgs-battle/dist/simulation-result';
import { BgsBattleSimulationExecutorService, SimRequestLane } from '@firestone/battlegrounds/core';
import { BugReportService, Preferences } from '@firestone/shared/common/service';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { createSimWorker } from './create-sim-worker';

/**
 * Host of the persistent compute web worker (Plans F and H ported to the web-worker
 * context, docs/electron-memory-investigation.md): BGS battle sims and, through
 * {@link request}, the end-of-game upload prep (see WebWorkerUploadPrepService). The
 * cards DB is structured-cloned to the worker once per worker lifetime instead of
 * once per fight (the +150-240 MB RSS spikes measured per fight on the old
 * spawn-per-fight design).
 *
 * The worker is released after IDLE_TTL with no in-flight work, so a renderer that
 * ran a single manual simulation (e.g. the BG simulator UI) doesn't retain the
 * worker's cards copy forever; during live games, fights are frequent enough to keep
 * it warm.
 */
const IDLE_TTL_MS = 5 * 60 * 1000;

export interface ComputeWorkerResponse {
	readonly done: boolean;
	readonly result?: string | null;
	readonly resultBytes?: Uint8Array | null;
}

/** Called with each response for the request; null means the worker itself errored */
type ResponseHandler = (data: ComputeWorkerResponse | null) => void;

@Injectable()
export class BgsBattleSimulationWorkerService extends BgsBattleSimulationExecutorService {
	// Throttle intermediate results to avoid excessive UI updates
	private lastIntermediateUpdate = 0;
	private readonly INTERMEDIATE_UPDATE_THROTTLE_MS = 100; // Max 10 updates/second

	private worker: Worker | null = null;
	private nextRequestId = 1;
	private readonly pending = new Map<number, ResponseHandler>();
	private idleTimer: ReturnType<typeof setTimeout> | null = null;
	/** Newest-first single-flight lane: a catch-up burst of stale sims must not
	 * serialize ahead of the live battle's sim on the sequential worker */
	private readonly simLane = new SimRequestLane();

	constructor(
		private readonly cards: CardsFacadeService,
		private readonly bugService: BugReportService,
		private readonly ngZone: NgZone,
	) {
		super();
	}

	public simulateLocalBattle(
		battleInfo: BgsBattleInfo,
		prefs: Preferences,
		includeOutcomeSamples: boolean,
		onResultReceived: (result: SimulationResult | null) => void,
	): void {
		const numberOfWorkers = 1; // Math.max(1, (this.cpuCount ?? 1) - 1);
		const numberOfSims = Math.floor(
			(battleInfo.options?.numberOfSimulations ?? prefs.bgsSimulatorNumberOfSims) / numberOfWorkers,
		);

		this.simLane.enqueue((done) => {
			this.request(
				{
					type: 'simulateBattle',
					battleInfo: {
						...battleInfo,
						options: {
							...battleInfo.options,
							numberOfSimulations: numberOfSims,
							includeOutcomeSamples: includeOutcomeSamples,
						},
					} as BgsBattleInfo,
				},
				(data) => {
					if (data == null || data.result == null) {
						// Worker error or sim exception
						done();
						this.reportSimCrash(battleInfo);
						this.ngZone.run(() => onResultReceived(null));
						return;
					}
					if (data.done) {
						done();
					}
					const result: SimulationResult = JSON.parse(data.result);
					if (!data.done) {
						const now = Date.now();
						if (now - this.lastIntermediateUpdate < this.INTERMEDIATE_UPDATE_THROTTLE_MS) {
							return;
						}
						this.lastIntermediateUpdate = now;
					}
					this.ngZone.run(() => onResultReceived(result));
				},
			);
		});
	}

	/**
	 * Sends a request to the shared worker; onResponse is called for every message of
	 * this request (intermediates with done: false, final with done: true) and with
	 * null if the worker errors. Used by the sim path above and by
	 * WebWorkerUploadPrepService.
	 */
	public request(message: Record<string, any>, onResponse: ResponseHandler): void {
		// Run worker creation and message handling OUTSIDE Angular's zone
		// This prevents Zone.js from patching the worker and triggering change detection
		this.ngZone.runOutsideAngular(() => {
			const worker = this.ensureWorker();
			if (!worker) {
				onResponse(null);
				return;
			}
			const id = this.nextRequestId++;
			this.pending.set(id, onResponse);
			this.armIdleTimer();
			worker.postMessage({ ...message, id: id });
		});
	}

	/** One-shot request: resolves with the final response, or null on worker error */
	public requestOnce(message: Record<string, any>): Promise<ComputeWorkerResponse | null> {
		return new Promise((resolve) => {
			this.request(message, (data) => {
				if (data == null || data.done) {
					resolve(data);
				}
			});
		});
	}

	/** Pre-warm the persistent worker (cards structured-clone) before combat. */
	public override ensureWorkerReady(): void {
		this.ngZone.runOutsideAngular(() => {
			this.ensureWorker();
		});
	}

	/** Overridable for tests */
	protected createWorkerInstance(): Worker {
		return createSimWorker();
	}

	private ensureWorker(): Worker | null {
		if (this.worker) {
			return this.worker;
		}
		try {
			const worker = this.createWorkerInstance();
			worker.onmessage = (ev: MessageEvent) => this.handleMessage(ev);
			worker.onerror = (error: ErrorEvent) => this.handleWorkerError(error);
			// Cards are cloned once per worker lifetime, not once per fight
			worker.postMessage({ type: 'init', cards: this.cards.getService() });
			this.worker = worker;
			console.log('[bgs-simulation] persistent compute worker spawned');
			return worker;
		} catch (e) {
			console.error('[bgs-simulation] could not spawn compute worker', e);
			return null;
		}
	}

	private handleMessage(ev: MessageEvent): void {
		const data = ev?.data;
		if (data?.id == null) {
			return;
		}
		const handler = this.pending.get(data.id);
		if (!handler) {
			return;
		}
		if (data.done) {
			this.pending.delete(data.id);
			this.armIdleTimer();
		}
		handler(data);
	}

	/** Uncaught worker error: fail all in-flight requests and respawn on next use */
	private handleWorkerError(error: ErrorEvent): void {
		const msg = error?.message ?? 'Unknown worker error';
		const file = error?.filename ?? '';
		const line = error?.lineno ?? 0;
		const col = error?.colno ?? 0;
		console.error(
			'[bgs-simulation] Worker error:',
			msg,
			file ? `at ${file}:${line}:${col}` : '',
			error?.error ?? '',
		);

		const failed = [...this.pending.values()];
		this.pending.clear();
		this.releaseWorker();
		for (const handler of failed) {
			handler(null);
		}
	}

	private reportSimCrash(battleInfo: BgsBattleInfo): void {
		if (!this.cards.getCards().length) {
			return;
		}
		console.debug('[bgs-simulation] Simulation crashed, cards loaded:', this.cards.getCards().length);
		this.bugService.submitAutomatedReport({
			type: 'bg-sim-crash',
			info: JSON.stringify({
				message: '[bgs-simulation] Simulation crashed',
				battleInfo: battleInfo,
			}),
		});
	}

	private armIdleTimer(): void {
		if (this.idleTimer) {
			clearTimeout(this.idleTimer);
			this.idleTimer = null;
		}
		this.idleTimer = setTimeout(() => {
			if (this.pending.size === 0) {
				console.log('[bgs-simulation] releasing idle compute worker');
				this.releaseWorker();
			} else {
				this.armIdleTimer();
			}
		}, IDLE_TTL_MS);
	}

	private releaseWorker(): void {
		if (this.idleTimer) {
			clearTimeout(this.idleTimer);
			this.idleTimer = null;
		}
		this.worker?.terminate();
		this.worker = null;
	}
}
