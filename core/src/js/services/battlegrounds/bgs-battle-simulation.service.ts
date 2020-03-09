import { HttpClient } from '@angular/common/http';
import { EventEmitter, Injectable } from '@angular/core';
import { BgsBattleInfo } from '../../models/battlegrounds/bgs-battle-info';
import { BgsBattleSimulationResult } from '../../models/battlegrounds/bgs-battle-simulation-result';
import { GameEvent } from '../../models/game-event';
import { Events } from '../events.service';
import { OverwolfService } from '../overwolf.service';
import { BattlegroundsBattleSimulationEvent } from './events/battlegrounds-battle-simulation-event';
import { BattlegroundsEvent } from './events/battlegrounds-event';

const BGS_BATTLE_SIMULATION_ENDPOINT = 'https://tsu2ztwayc.execute-api.us-west-2.amazonaws.com/Prod/{proxy+}';

@Injectable()
export class BgsBattleSimulationService {
	private stateUpdater: EventEmitter<GameEvent | BattlegroundsEvent>;

	constructor(
		private readonly events: Events,
		private readonly http: HttpClient,
		private readonly ow: OverwolfService,
	) {
		events.on(Events.START_BGS_BATTLE_SIMULATION).subscribe(event => this.startBgsBattleSimulation(event.data[0]));
		this.stateUpdater = this.ow.getMainWindow().battlegroundsUpdater;
	}

	private async startBgsBattleSimulation(battleInfo: BgsBattleInfo) {
		console.log('[bgs-simulation] battle simulation request sent');
		const result: BgsBattleSimulationResult = (await this.http
			.post(BGS_BATTLE_SIMULATION_ENDPOINT, battleInfo)
			.toPromise()) as BgsBattleSimulationResult;
		console.log('[bgs-simulation] battle simulation result', result);
		this.stateUpdater.next(new BattlegroundsBattleSimulationEvent(result));
	}
}
