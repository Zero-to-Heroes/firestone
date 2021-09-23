import { HttpClient } from '@angular/common/http';
import { EventEmitter, Injectable, Optional } from '@angular/core';
import { Race } from '@firestone-hs/reference-data';
import { BgsBattleInfo } from '@firestone-hs/simulate-bgs-battle/dist/bgs-battle-info';
import { BgsBattleOptions } from '@firestone-hs/simulate-bgs-battle/dist/bgs-battle-options';
import { CardsData } from '@firestone-hs/simulate-bgs-battle/dist/cards/cards-data';
import { OutcomeSamples, SimulationResult } from '@firestone-hs/simulate-bgs-battle/dist/simulation-result';
import { GameSample } from '@firestone-hs/simulate-bgs-battle/dist/simulation/spectator/game-sample';
import { CardsFacadeService } from '@services/cards-facade.service';
import Worker from 'worker-loader!../../workers/bgs-simulation.worker';
import { Preferences } from '../../models/preferences';
import { OverwolfService } from '../overwolf.service';
import { PreferencesService } from '../preferences.service';
import { sumOnArray } from '../utils';
import { normalizeHeroCardId } from './bgs-utils';
import { BattlegroundsBattleSimulationEvent } from './store/events/battlegrounds-battle-simulation-event';
import { BattlegroundsStoreEvent } from './store/events/_battlegrounds-store-event';

const BGS_BATTLE_SIMULATION_ENDPOINT = 'https://o5gz4ktmfl.execute-api.us-west-2.amazonaws.com/Prod/{proxy+}';
const BGS_BATTLE_SIMULATION_SAMPLE_ENDPOINT = 'https://bmphmnu4gk.execute-api.us-west-2.amazonaws.com/Prod/{proxy+}';

@Injectable()
export class BgsBattleSimulationService {
	private stateUpdater: EventEmitter<BattlegroundsStoreEvent>;
	private cardsData: CardsData;

	private cpuCount: number;

	constructor(
		private readonly http: HttpClient,
		@Optional() private readonly ow: OverwolfService,
		private readonly cards: CardsFacadeService,
		@Optional() private readonly prefs: PreferencesService,
	) {
		if (ow?.isOwEnabled()) {
			setTimeout(() => {
				this.stateUpdater = this.ow.getMainWindow().battlegroundsUpdater;
			});
		}
		this.init();
	}

	private async init() {
		this.cardsData = new CardsData(this.cards.getService(), false);
		this.cardsData.inititialize();
		if (this.ow?.isOwEnabled()) {
			const systemInfo = await this.ow.getSystemInformation();
			console.log('systemInfo', systemInfo);
			this.cpuCount = systemInfo?.PhysicalCPUCount ?? 1;
			console.log('CPU count', this.cpuCount);
		}
	}

	public async startBgsBattleSimulation(battleInfo: BgsBattleInfo, races: readonly Race[]) {
		const prefs = await this.prefs.getPreferences();
		if (!prefs.bgsEnableSimulation || !prefs.bgsFullToggle) {
			console.log('[bgs-simulation] simulation turned off');
			return;
		}
		const options: BgsBattleOptions = {
			...battleInfo.options,
			validTribes: races,
		} as BgsBattleOptions;
		const battleInfoInput: BgsBattleInfo = {
			...battleInfo,
			options,
		};
		console.log(
			'no-format',
			'[bgs-simulation] battle simulation request prepared',
			battleInfo,
			prefs.bgsUseLocalSimulator,
		);

		const result: SimulationResult = prefs.bgsUseLocalSimulator
			? await this.simulateLocalBattle(battleInfoInput, prefs)
			: ((await this.http.post(BGS_BATTLE_SIMULATION_ENDPOINT, battleInfoInput).toPromise()) as SimulationResult);
		console.log('[bgs-simulation] battle simulation result', result);
		this.stateUpdater.next(
			new BattlegroundsBattleSimulationEvent(
				result,
				normalizeHeroCardId(battleInfoInput.opponentBoard.player.nonGhostCardId),
			),
		);
	}

	public async getIdForSimulationSample(sample: GameSample): Promise<string> {
		console.log('calling sample endpoint', sample);
		try {
			const result: any = (await this.http
				.post(BGS_BATTLE_SIMULATION_SAMPLE_ENDPOINT, sample)
				.toPromise()) as string;
			console.log('[bgs-simulation] id for simulation sample', result);
			return result;
		} catch (e) {
			console.error('[bgs-simulation] could not get if from sample', e.message, sample, e);
			return null;
		}
	}

	public async getIdForSimulationSampleWithFetch(sample: GameSample): Promise<string> {
		console.log('calling fetch sample endpoint', sample);
		try {
			const response = await fetch(BGS_BATTLE_SIMULATION_SAMPLE_ENDPOINT, {
				method: 'POST',
				mode: 'cors',
				// credentials: 'same-origin',
				headers: {
					'Content-Type': 'application/json',
					// 'Content-Type': 'application/x-www-form-urlencoded',
				},
				body: JSON.stringify(sample),
			});
			console.log('[bgs-simulation] id for simulation sample', response);
			return response.text();
		} catch (e) {
			console.error('[bgs-simulation] could not get if from sample', e.message, sample, e);
			return null;
		}
	}

	public async simulateLocalBattle(battleInfo: BgsBattleInfo, prefs: Preferences): Promise<SimulationResult> {
		const numberOfWorkers = 1; // Math.max(1, (this.cpuCount ?? 1) - 1);
		console.debug('[bgs-simulation] will run parallel simulations', numberOfWorkers);
		const results = await Promise.all(
			[...Array(numberOfWorkers).keys()].map((i) =>
				this.simulateLocalBattleInstance(
					battleInfo,
					prefs,
					Math.floor(prefs.bgsSimulatorNumberOfSims / numberOfWorkers),
				),
			),
		);
		console.debug('[bgs-simulation] sim results', results);
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

	public async simulateLocalBattleInstance(
		battleInfo: BgsBattleInfo,
		prefs: Preferences,
		numberOfSims: number,
	): Promise<SimulationResult> {
		return new Promise<SimulationResult>((resolve) => {
			const worker = new Worker();
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
