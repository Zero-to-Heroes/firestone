import { BattlegroundsStoreEvent } from './_battlegrounds-store-event';

export class BgsSelectBattleEvent extends BattlegroundsStoreEvent {
	constructor(public readonly faceOffId: string) {
		super('BgsSelectBattleEvent');
	}
}
