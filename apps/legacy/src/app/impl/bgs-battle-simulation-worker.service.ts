import { Injectable } from '@angular/core';
import { BgsBattleInfo } from '@firestone-hs/simulate-bgs-battle/dist/bgs-battle-info';
import { OutcomeSamples, SimulationResult } from '@firestone-hs/simulate-bgs-battle/dist/simulation-result';
import { Preferences } from '../../../../../libs/legacy/feature-shell/src/lib/js/models/preferences';
import { BgsBattleSimulationExecutorService } from '../../../../../libs/legacy/feature-shell/src/lib/js/services/battlegrounds/bgs-battle-simulation-executor.service';
import { CardsFacadeService } from '../../../../../libs/legacy/feature-shell/src/lib/js/services/cards-facade.service';
import { sumOnArray } from '../../../../../libs/legacy/feature-shell/src/lib/js/services/utils';

@Injectable()
export class BgsBattleSimulationWorkerService extends BgsBattleSimulationExecutorService {
	constructor(private readonly cards: CardsFacadeService) {
		super();
	}

	public async simulateLocalBattle(battleInfo: BgsBattleInfo, prefs: Preferences): Promise<SimulationResult> {
		const numberOfWorkers = 1; // Math.max(1, (this.cpuCount ?? 1) - 1);
		const results = await Promise.all(
			[...Array(numberOfWorkers).keys()].map((i) =>
				this.simulateLocalBattleInstance(
					battleInfo,
					Math.floor(prefs.bgsSimulatorNumberOfSims / numberOfWorkers),
				),
			),
		);
		return this.mergeSimulationResults(results);
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

	private async simulateLocalBattleInstance(
		battleInfo: BgsBattleInfo,
		numberOfSims: number,
	): Promise<SimulationResult> {
		return new Promise<SimulationResult>((resolve) => {
			const worker = new Worker(new URL('./bgs-battle-sim-worker.worker', import.meta.url));
			worker.onmessage = (ev: MessageEvent) => {
				worker.terminate();
				resolve(JSON.parse(ev.data));
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
		});
	}
}
