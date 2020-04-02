import { HttpClient } from '@angular/common/http';
import { EventEmitter, Injectable } from '@angular/core';
import { AllCardsService } from '@firestone-hs/replay-parser';
import { simulateBattle } from '@firestone-hs/simulate-bgs-battle';
import { BgsBattleInfo } from '@firestone-hs/simulate-bgs-battle/dist/bgs-battle-info';
import { CardsData } from '@firestone-hs/simulate-bgs-battle/dist/cards/cards-data';
import { BgsBattleSimulationResult } from '../../models/battlegrounds/bgs-battle-simulation-result';
import { OverwolfService } from '../overwolf.service';
import { PreferencesService } from '../preferences.service';
import { BattlegroundsBattleSimulationEvent } from './store/events/battlegrounds-battle-simulation-event';
import { BattlegroundsStoreEvent } from './store/events/_battlegrounds-store-event';

const BGS_BATTLE_SIMULATION_ENDPOINT = 'https://tsu2ztwayc.execute-api.us-west-2.amazonaws.com/Prod/{proxy+}';

@Injectable()
export class BgsBattleSimulationService {
	private stateUpdater: EventEmitter<BattlegroundsStoreEvent>;
	private cardsData: CardsData;

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
	}

	public async startBgsBattleSimulation(battleInfo: BgsBattleInfo) {
		const prefs = await this.prefs.getPreferences();
		console.log(
			'[bgs-simulation] battle simulation request prepared',
			battleInfo,
			prefs.bgsUseLocalSimulator,
			JSON.stringify(battleInfo, null, 4),
		);
		const result: BgsBattleSimulationResult = prefs.bgsUseLocalSimulator
			? simulateBattle(battleInfo, this.cards.service, this.cardsData)
			: ((await this.http
					.post(BGS_BATTLE_SIMULATION_ENDPOINT, battleInfo)
					.toPromise()) as BgsBattleSimulationResult);
		console.log('[bgs-simulation] battle simulation result', result);
		this.stateUpdater.next(new BattlegroundsBattleSimulationEvent(result));
	}
}
