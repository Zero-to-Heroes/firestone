import { Injectable, NgZone } from '@angular/core';
import { BgsBattleInfo } from '@firestone-hs/simulate-bgs-battle/dist/bgs-battle-info';
import { SimulationResult } from '@firestone-hs/simulate-bgs-battle/dist/simulation-result';
import { BgsBattleSimulationExecutorService } from '@firestone/battlegrounds/core';
import { BugReportService, Preferences } from '@firestone/shared/common/service';
import { CardsFacadeService } from '@firestone/shared/framework/core';

@Injectable()
export class BgsBattleSimulationWorkerService extends BgsBattleSimulationExecutorService {
	// Throttle intermediate results to avoid excessive UI updates
	private lastIntermediateUpdate = 0;
	private readonly INTERMEDIATE_UPDATE_THROTTLE_MS = 100; // Max 10 updates/second

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
		this.simulateLocalBattleInstance(
			battleInfo,
			Math.floor((battleInfo.options?.numberOfSimulations ?? prefs.bgsSimulatorNumberOfSims) / numberOfWorkers),
			includeOutcomeSamples,
			onResultReceived,
		);
	}

	private simulateLocalBattleInstance(
		battleInfo: BgsBattleInfo,
		numberOfSims: number,
		includeOutcomeSamples: boolean,
		onResultReceived: (result: SimulationResult | null) => void,
	): void {
		// Run worker creation and message handling OUTSIDE Angular's zone
		// This prevents Zone.js from patching the worker and triggering change detection
		this.ngZone.runOutsideAngular(() => {
			const worker = new Worker(new URL('./bgs-battle-sim-worker.worker', import.meta.url));

			worker.onmessage = (ev: MessageEvent) => {
				if (!ev?.data) {
					this.handleWorkerError(worker, battleInfo, onResultReceived);
					return;
				}

				const result: SimulationResult = JSON.parse(ev.data);
				const isFinalResult = !!result.outcomeSamples;

				if (isFinalResult) {
					worker.terminate();
				}

				if (!isFinalResult) {
					const now = Date.now();
					if (now - this.lastIntermediateUpdate < this.INTERMEDIATE_UPDATE_THROTTLE_MS) {
						return;
					}
					this.lastIntermediateUpdate = now;
				}

				this.ngZone.run(() => {
					onResultReceived(result);
				});
			};

			worker.onerror = (error: ErrorEvent) => {
				const msg = error?.message ?? 'Unknown worker error';
				const file = error?.filename ?? '';
				const line = error?.lineno ?? 0;
				const col = error?.colno ?? 0;
				const err = error?.error;
				console.error(
					'[bgs-simulation] Worker error:',
					msg,
					file ? `at ${file}:${line}:${col}` : '',
					err ?? '',
				);
				worker.terminate();
				this.ngZone.run(() => {
					onResultReceived(null);
				});
			};

			worker.postMessage({
				battleMessage: {
					...battleInfo,
					options: {
						...battleInfo.options,
						numberOfSimulations: numberOfSims,
						includeOutcomeSamples: includeOutcomeSamples,
					},
				} as BgsBattleInfo,
				cards: this.cards.getService(),
			});
		});
	}

	private handleWorkerError(
		worker: Worker,
		battleInfo: BgsBattleInfo,
		onResultReceived: (result: SimulationResult | null) => void,
	): void {
		if (!!this.cards.getCards().length) {
			console.debug('[bgs-simulation] Simulation crashed, cards loaded:', this.cards.getCards().length);
			this.bugService.submitAutomatedReport({
				type: 'bg-sim-crash',
				info: JSON.stringify({
					message: '[bgs-simulation] Simulation crashed',
					battleInfo: battleInfo,
				}),
			});
		}
		worker.terminate();
		this.ngZone.run(() => {
			onResultReceived(null);
		});
	}
}
