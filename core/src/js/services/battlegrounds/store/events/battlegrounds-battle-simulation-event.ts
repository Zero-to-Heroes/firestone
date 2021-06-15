import { SimulationResult } from '@firestone-hs/simulate-bgs-battle/dist/simulation-result';
import { BattlegroundsStoreEvent } from './_battlegrounds-store-event';

export class BattlegroundsBattleSimulationEvent extends BattlegroundsStoreEvent {
	constructor(public readonly result: SimulationResult, public readonly opponentHeroCardId: string) {
		super('BattlegroundsBattleSimulationEvent');
	}
}
