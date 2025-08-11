import { Injectable } from '@angular/core';
import { BgsBattleInfo } from '@firestone-hs/simulate-bgs-battle/dist/bgs-battle-info';
import { SimulationResult } from '@firestone-hs/simulate-bgs-battle/dist/simulation-result';
import { BgsBattleSimulationExecutorService } from '@firestone/battlegrounds/core';
import { Preferences } from '@firestone/shared/common/service';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { join } from 'path';
import { Worker } from 'worker_threads';

@Injectable()
export class BgsBattleSimulationWorkerService extends BgsBattleSimulationExecutorService {
	constructor(private readonly cards: CardsFacadeService) {
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
		// Get the path to the worker file
		// In production, __dirname will point to dist/apps/electron-app/ (where main.js is)
		// The worker file is compiled to the root: bgs-battle-sim-worker.thread.js
		const workerPath = join(__dirname, 'bgs-battle-sim-worker.thread.js');

		const worker = new Worker(workerPath);

		worker.on('message', (data: string | null) => {
			if (data === null) {
				if (!!this.cards.getCards().length) {
					console.debug('[bgs-simulation] Simulation crashed, cards loaded:', this.cards.getCards().length);
					// Note: BugReportService is not available in electron-app, so we skip the bug report
				}
				worker.terminate();
				onResultReceived(null);
				return;
			}

			const result: SimulationResult = JSON.parse(data);
			if (!!result.outcomeSamples) {
				worker.terminate();
			}
			console.log('[bgs-simulation] Simulation result received');
			onResultReceived(result);
		});

		worker.on('error', (error) => {
			console.error('[bgs-simulation] Worker error:', error);
			worker.terminate();
			onResultReceived(null);
		});

		worker.on('exit', (code) => {
			if (code !== 0) {
				console.error(`[bgs-simulation] Worker stopped with exit code ${code}`);
			}
		});

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
	}
}
