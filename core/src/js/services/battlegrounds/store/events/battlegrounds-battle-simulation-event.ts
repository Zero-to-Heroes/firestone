import { BgsBattleSimulationResult } from '../../../../models/battlegrounds/bgs-battle-simulation-result';
import { BattlegroundsStoreEvent } from './_battlegrounds-store-event';

export class BattlegroundsBattleSimulationEvent extends BattlegroundsStoreEvent {
	constructor(public readonly result: BgsBattleSimulationResult) {
		super('BattlegroundsBattleSimulationEvent');
	}
}
