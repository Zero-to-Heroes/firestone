import { Injectable } from '@angular/core';
import { BgsBattleInfo } from '@firestone-hs/simulate-bgs-battle/dist/bgs-battle-info';
import { SimulationResult } from '@firestone-hs/simulate-bgs-battle/dist/simulation-result';
import { BgsBattleSimulationExecutorService, SimRequestLane } from '@firestone/battlegrounds/core';
import { Preferences } from '@firestone/shared/common/service';
import { ComputeWorkerHost } from './compute-worker-host';

/**
 * Electron BGS battle simulator (Plan F, docs/electron-memory-investigation.md):
 * runs sims in the persistent compute worker. Previously a new worker was spawned
 * per fight with the whole cards DB structured-cloned to it every time, causing
 * +150-240 MB RSS spikes about once per turn (and leaking idle workers when no
 * outcome samples were requested); now the cards are cloned once per app run.
 *
 * Sims go through a newest-first single-flight lane (see SimRequestLane): during
 * log catch-up every past face-off fires a sim at once, and posting them all to
 * the sequential worker would put minutes of stale sims ahead of the live battle.
 */
@Injectable()
export class BgsBattleSimulationWorkerService extends BgsBattleSimulationExecutorService {
	private readonly simLane = new SimRequestLane();

	constructor(private readonly workerHost: ComputeWorkerHost) {
		super();
	}

	public simulateLocalBattle(
		battleInfo: BgsBattleInfo,
		prefs: Preferences,
		includeOutcomeSamples: boolean,
		onResultReceived: (result: SimulationResult | null) => void,
	): void {
		console.log('[bgs-simulation] simulateLocalBattle');
		const numberOfWorkers = 1; // Math.max(1, (this.cpuCount ?? 1) - 1);
		const battleInfoForWorker = {
			...battleInfo,
			options: {
				...battleInfo.options,
				numberOfSimulations: Math.floor(
					(battleInfo.options?.numberOfSimulations ?? prefs.bgsSimulatorNumberOfSims) / numberOfWorkers,
				),
				includeOutcomeSamples: includeOutcomeSamples,
			},
		} as BgsBattleInfo;

		this.simLane.enqueue((done) => {
			this.workerHost.stream({ type: 'simulateBattle', battleInfo: battleInfoForWorker }, (response) => {
				if (!response || !response.ok || !response.result) {
					console.error('[bgs-simulation] simulation failed', response?.error ?? 'worker unavailable');
					done();
					onResultReceived(null);
					return;
				}
				if (response.done) {
					done();
				}
				const result: SimulationResult = JSON.parse(response.result);
				console.debug('[bgs-simulation] Simulation result received');
				onResultReceived(result);
			});
		});
	}

	public override ensureWorkerReady(): void {
		this.workerHost.prewarm();
	}
}
