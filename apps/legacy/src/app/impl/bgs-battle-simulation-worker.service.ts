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
		// const results = await Promise.all(
		// 	[...Array(numberOfWorkers).keys()].map((i) =>
		// 		this.simulateLocalBattleInstance(
		// 			battleInfo,
		// 			Math.floor(prefs.bgsSimulatorNumberOfSims / numberOfWorkers),
		// 		),
		// 	),
		// );
		// return this.mergeSimulationResults(results?.filter((result) => result != null) ?? []);
	}

	private mergeSimulationResults(results: SimulationResult[]): SimulationResult {
		return null;
		// const wonLethal = sumOnArray(results, (result) => result.wonLethal);
		// const won = sumOnArray(results, (result) => result.won);
		// const tied = sumOnArray(results, (result) => result.tied);
		// const lost = sumOnArray(results, (result) => result.lost);
		// const lostLethal = sumOnArray(results, (result) => result.lostLethal);
		// const totalBattles = won + tied + lost;
		// const damageWon = sumOnArray(results, (result) => result.damageWon);
		// const damageLost = sumOnArray(results, (result) => result.damageLost);
		// const outcomeSamples: OutcomeSamples = {
		// 	won: results
		// 		.map((result) => result.outcomeSamples.won)
		// 		.reduce((a, b) => a.concat(b), [])
		// 		.slice(0, 1),
		// 	tied: results
		// 		.map((result) => result.outcomeSamples.tied)
		// 		.reduce((a, b) => a.concat(b), [])
		// 		.slice(0, 1),
		// 	lost: results
		// 		.map((result) => result.outcomeSamples.lost)
		// 		.reduce((a, b) => a.concat(b), [])
		// 		.slice(0, 1),
		// };
		// return {
		// 	wonLethal: wonLethal,
		// 	won: won,
		// 	tied: tied,
		// 	lost: lost,
		// 	lostLethal: lostLethal,
		// 	damageWon: damageWon,
		// 	damageLost: damageLost,
		// 	averageDamageWon: won === 0 ? 0 : damageWon / won,
		// 	averageDamageLost: lost === 0 ? 0 : damageLost / lost,
		// 	wonLethalPercent: totalBattles === 0 ? undefined : (100 * wonLethal) / totalBattles,
		// 	wonPercent: totalBattles === 0 ? undefined : (100 * won) / totalBattles,
		// 	tiedPercent: totalBattles === 0 ? undefined : (100 * tied) / totalBattles,
		// 	lostPercent: totalBattles === 0 ? undefined : (100 * lost) / totalBattles,
		// 	lostLethalPercent: totalBattles === 0 ? undefined : (100 * lostLethal) / totalBattles,
		// 	outcomeSamples: outcomeSamples,
		// };
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
				// All heavy processing happens outside the zone
				if (!ev?.data) {
					this.handleWorkerError(worker, battleInfo, onResultReceived);
					return;
				}

				// Parse JSON outside the zone - this is expensive!
				const result: SimulationResult = JSON.parse(ev.data);
				const isFinalResult = !!result.outcomeSamples;

				if (isFinalResult) {
					worker.terminate();
				}

				// Throttle intermediate results to reduce UI updates
				if (!isFinalResult) {
					const now = Date.now();
					if (now - this.lastIntermediateUpdate < this.INTERMEDIATE_UPDATE_THROTTLE_MS) {
						return; // Skip this intermediate update
					}
					this.lastIntermediateUpdate = now;
				}

				// Only re-enter Angular zone to deliver the result
				// This is the ONLY point where change detection should be triggered
				this.ngZone.run(() => {
					onResultReceived(result);
				});
			};

			worker.onerror = (error) => {
				console.error('[bgs-simulation] Worker error:', error);
				worker.terminate();
				this.ngZone.run(() => {
					onResultReceived(null);
				});
			};

			// postMessage also runs outside zone
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
		// Re-enter zone for the callback
		this.ngZone.run(() => {
			onResultReceived(null);
		});
	}
}
