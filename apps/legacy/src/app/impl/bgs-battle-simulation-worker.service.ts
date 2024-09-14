import { Injectable } from '@angular/core';
import { BgsBattleInfo } from '@firestone-hs/simulate-bgs-battle/dist/bgs-battle-info';
import { OutcomeSamples, SimulationResult } from '@firestone-hs/simulate-bgs-battle/dist/simulation-result';
import { BgsBattleSimulationExecutorService } from '@firestone/battlegrounds/core';
import { BugReportService, Preferences } from '@firestone/shared/common/service';
import { sumOnArray } from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';

@Injectable()
export class BgsBattleSimulationWorkerService extends BgsBattleSimulationExecutorService {
	constructor(private readonly cards: CardsFacadeService, private readonly bugService: BugReportService) {
		super();
	}

	public simulateLocalBattle(
		battleInfo: BgsBattleInfo,
		prefs: Preferences,
		onResultReceived: (result: SimulationResult | null) => void,
	): void {
		const numberOfWorkers = 1; // Math.max(1, (this.cpuCount ?? 1) - 1);
		this.simulateLocalBattleInstance(
			battleInfo,
			Math.floor((battleInfo.options?.numberOfSimulations ?? prefs.bgsSimulatorNumberOfSims) / numberOfWorkers),
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
		const wonLethal = sumOnArray(results, (result) => result.wonLethal);
		const won = sumOnArray(results, (result) => result.won);
		const tied = sumOnArray(results, (result) => result.tied);
		const lost = sumOnArray(results, (result) => result.lost);
		const lostLethal = sumOnArray(results, (result) => result.lostLethal);
		const totalBattles = won + tied + lost;
		const damageWon = sumOnArray(results, (result) => result.damageWon);
		const damageLost = sumOnArray(results, (result) => result.damageLost);
		const outcomeSamples: OutcomeSamples = {
			won: results
				.map((result) => result.outcomeSamples.won)
				.reduce((a, b) => a.concat(b), [])
				.slice(0, 1),
			tied: results
				.map((result) => result.outcomeSamples.tied)
				.reduce((a, b) => a.concat(b), [])
				.slice(0, 1),
			lost: results
				.map((result) => result.outcomeSamples.lost)
				.reduce((a, b) => a.concat(b), [])
				.slice(0, 1),
		};
		return {
			wonLethal: wonLethal,
			won: won,
			tied: tied,
			lost: lost,
			lostLethal: lostLethal,
			damageWon: damageWon,
			damageLost: damageLost,
			averageDamageWon: won === 0 ? 0 : damageWon / won,
			averageDamageLost: lost === 0 ? 0 : damageLost / lost,
			wonLethalPercent: totalBattles === 0 ? undefined : (100 * wonLethal) / totalBattles,
			wonPercent: totalBattles === 0 ? undefined : (100 * won) / totalBattles,
			tiedPercent: totalBattles === 0 ? undefined : (100 * tied) / totalBattles,
			lostPercent: totalBattles === 0 ? undefined : (100 * lost) / totalBattles,
			lostLethalPercent: totalBattles === 0 ? undefined : (100 * lostLethal) / totalBattles,
			outcomeSamples: outcomeSamples,
		};
	}

	private simulateLocalBattleInstance(
		battleInfo: BgsBattleInfo,
		numberOfSims: number,
		onResultReceived: (result: SimulationResult | null) => void,
	): void {
		const worker = new Worker(new URL('./bgs-battle-sim-worker.worker', import.meta.url));
		worker.onmessage = (ev: MessageEvent) => {
			if (!ev?.data) {
				if (!!this.cards.getCards().length) {
					this.bugService.submitAutomatedReport({
						type: 'bg-sim-crash',
						info: JSON.stringify({
							message: '[bgs-simulation] Simulation crashed',
							battleInfo: battleInfo,
						}),
					});
				}
				worker.terminate();
				onResultReceived(null);
				return;
			}
			const result: SimulationResult = JSON.parse(ev.data);
			if (!!result.outcomeSamples) {
				worker.terminate();
			}
			onResultReceived(result);
		};
		worker.postMessage({
			battleMessage: {
				...battleInfo,
				options: {
					...battleInfo.options,
					numberOfSimulations: numberOfSims,
				},
			} as BgsBattleInfo,
			cards: this.cards.getService(),
		});
	}
}
