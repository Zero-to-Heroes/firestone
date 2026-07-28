import { Injectable, NgZone } from '@angular/core';
import { BgsBattleInfo } from '@firestone-hs/simulate-bgs-battle/dist/bgs-battle-info';
import { SimulationResult } from '@firestone-hs/simulate-bgs-battle/dist/simulation-result';
import { BgsBattleSimulationExecutorService } from '@firestone/battlegrounds/core';
import { BugReportService, Preferences } from '@firestone/shared/common/service';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { createSimWorker } from './create-sim-worker';

/**
 * Runs BGS battle sims in a web worker that is kept alive across fights (Plan F port
 * to the web-worker context, docs/electron-memory-investigation.md): the cards DB is
 * structured-cloned to the worker once per worker lifetime instead of once per fight
 * (the +150-240 MB RSS spikes measured per fight on the old spawn-per-fight design).
 *
 * The worker is released after IDLE_TTL of no sims, so a renderer that ran a single
 * manual simulation (e.g. the BG simulator UI) doesn't retain the worker's cards copy
 * forever; during live games, fights are frequent enough to keep it warm.
 */
const IDLE_TTL_MS = 5 * 60 * 1000;

interface PendingSim {
	readonly onResultReceived: (result: SimulationResult | null) => void;
	readonly battleInfo: BgsBattleInfo;
}

@Injectable()
export class BgsBattleSimulationWorkerService extends BgsBattleSimulationExecutorService {
	// Throttle intermediate results to avoid excessive UI updates
	private lastIntermediateUpdate = 0;
	private readonly INTERMEDIATE_UPDATE_THROTTLE_MS = 100; // Max 10 updates/second

	private worker: Worker | null = null;
	private nextRequestId = 1;
	private readonly pending = new Map<number, PendingSim>();
	private idleTimer: ReturnType<typeof setTimeout> | null = null;

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

		// Run worker creation and message handling OUTSIDE Angular's zone
		// This prevents Zone.js from patching the worker and triggering change detection
		this.ngZone.runOutsideAngular(() => {
			const worker = this.ensureWorker();
			if (!worker) {
				this.ngZone.run(() => onResultReceived(null));
				return;
			}
			const id = this.nextRequestId++;
			this.pending.set(id, { onResultReceived, battleInfo });
			this.armIdleTimer();
			worker.postMessage({
				id: id,
				type: 'simulateBattle',
				battleInfo: {
					...battleInfo,
					options: {
						...battleInfo.options,
						numberOfSimulations: numberOfSims,
						includeOutcomeSamples: includeOutcomeSamples,
					},
				} as BgsBattleInfo,
			});
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
			console.log('[bgs-simulation] persistent sim worker spawned');
			return worker;
		} catch (e) {
			console.error('[bgs-simulation] could not spawn sim worker', e);
			return null;
		}
	}

	private handleMessage(ev: MessageEvent): void {
		const data = ev?.data;
		if (data?.id == null) {
			return;
		}
		const request = this.pending.get(data.id);
		if (!request) {
			return;
		}

		if (data.result == null) {
			// The worker caught an exception for this sim
			this.pending.delete(data.id);
			this.reportSimCrash(request.battleInfo);
			this.ngZone.run(() => request.onResultReceived(null));
			return;
		}

		const result: SimulationResult = JSON.parse(data.result);
		if (data.done) {
			this.pending.delete(data.id);
			this.armIdleTimer();
		} else {
			const now = Date.now();
			if (now - this.lastIntermediateUpdate < this.INTERMEDIATE_UPDATE_THROTTLE_MS) {
				return;
			}
			this.lastIntermediateUpdate = now;
		}

		this.ngZone.run(() => request.onResultReceived(result));
	}

	/** Uncaught worker error: fail all in-flight sims and respawn on next use */
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
		for (const request of failed) {
			this.reportSimCrash(request.battleInfo);
			this.ngZone.run(() => request.onResultReceived(null));
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
				console.log('[bgs-simulation] releasing idle sim worker');
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
