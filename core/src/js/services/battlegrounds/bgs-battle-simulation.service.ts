import { HttpClient } from '@angular/common/http';
import { EventEmitter, Injectable } from '@angular/core';
import { AllCardsService } from '@firestone-hs/replay-parser';
import { BgsBattleInfo } from '@firestone-hs/simulate-bgs-battle/dist/bgs-battle-info';
import { CardsData } from '@firestone-hs/simulate-bgs-battle/dist/cards/cards-data';
import Worker from 'worker-loader!../../workers/bgs-simulation.worker';
import { BgsBattleSimulationResult } from '../../models/battlegrounds/bgs-battle-simulation-result';
import { Preferences } from '../../models/preferences';
import { OverwolfService } from '../overwolf.service';
import { PreferencesService } from '../preferences.service';
import { BattlegroundsBattleSimulationEvent } from './store/events/battlegrounds-battle-simulation-event';
import { BattlegroundsStoreEvent } from './store/events/_battlegrounds-store-event';

const BGS_BATTLE_SIMULATION_ENDPOINT = 'https://tsu2ztwayc.execute-api.us-west-2.amazonaws.com/Prod/{proxy+}';

@Injectable()
export class BgsBattleSimulationService {
	private stateUpdater: EventEmitter<BattlegroundsStoreEvent>;
	private cardsData: CardsData;
	private worker: Worker;

	constructor(
		private readonly http: HttpClient,
		private readonly ow: OverwolfService,
		private readonly cards: AllCardsService,
		private readonly prefs: PreferencesService,
	) {
		setTimeout(() => {
			this.stateUpdater = this.ow.getMainWindow().battlegroundsUpdater;
		});
		this.cardsData = new CardsData(cards.service, false);
		this.cardsData.inititialize();
		// this.worker = new Worker();

		// this.startBgsBattleSimulation({ hop: 'test' } as any);
	}

	public async startBgsBattleSimulation(battleInfo: BgsBattleInfo) {
		const prefs = await this.prefs.getPreferences();
		console.log(
			'no-format',
			'[bgs-simulation] battle simulation request prepared',
			battleInfo,
			prefs.bgsUseLocalSimulator,
			JSON.stringify(battleInfo, null, 4),
		);

		const result: BgsBattleSimulationResult = prefs.bgsUseLocalSimulator
			? await this.simulateLocalBattle(battleInfo, prefs)
			: ((await this.http
					.post(BGS_BATTLE_SIMULATION_ENDPOINT, battleInfo)
					.toPromise()) as BgsBattleSimulationResult);
		console.log('[bgs-simulation] battle simulation result', result);
		this.stateUpdater.next(new BattlegroundsBattleSimulationEvent(result));
	}

	private async simulateLocalBattle(
		battleInfo: BgsBattleInfo,
		prefs: Preferences,
	): Promise<BgsBattleSimulationResult> {
		return new Promise<BgsBattleSimulationResult>(resolve => {
			const worker = new Worker();
			worker.onmessage = (ev: MessageEvent) => {
				// console.log('received worker message', ev);
				worker.terminate();
				resolve(JSON.parse(ev.data));
			};
			// console.log('created worker', worker);
			worker.postMessage({
				...battleInfo,
				options: {
					numberOfSimulations: Math.floor(prefs.bgsSimulatorNumberOfSims),
				},
			} as BgsBattleInfo);
			// console.log('posted worker message');
		});
	}
}
