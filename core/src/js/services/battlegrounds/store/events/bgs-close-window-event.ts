import { BattlegroundsStoreEvent } from './_battlegrounds-store-event';

export class BgsCloseWindowEvent extends BattlegroundsStoreEvent {
	constructor() {
		super('BgsCloseWindowEvent');
	}
}
