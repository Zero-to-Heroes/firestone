import { BattlegroundsStoreEvent } from './_battlegrounds-store-event';

export class BgsInitMmrEvent extends BattlegroundsStoreEvent {
	constructor() {
		super('BgsInitMmrEvent');
	}
}
