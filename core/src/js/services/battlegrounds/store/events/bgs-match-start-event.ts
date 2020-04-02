import { BattlegroundsStoreEvent } from './_battlegrounds-store-event';

export class BgsMatchStartEvent extends BattlegroundsStoreEvent {
	constructor() {
		super('BgsMatchStartEvent');
	}
}
