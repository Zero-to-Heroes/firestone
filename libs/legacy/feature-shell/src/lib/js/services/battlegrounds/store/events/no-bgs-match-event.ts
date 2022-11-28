import { BattlegroundsStoreEvent } from './_battlegrounds-store-event';

export class NoBgsMatchEvent extends BattlegroundsStoreEvent {
	constructor() {
		super('NoBgsMatchEvent');
	}
}
