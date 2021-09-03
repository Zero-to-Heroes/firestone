import { BattlegroundsStoreEvent } from './_battlegrounds-store-event';

export class BgsBattleSimulationResetEvent extends BattlegroundsStoreEvent {
	constructor(public readonly faceOffId: string) {
		super('BgsBattleSimulationResetEvent');
	}
}
