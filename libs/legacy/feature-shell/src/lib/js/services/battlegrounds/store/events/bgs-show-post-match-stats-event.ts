import { BattlegroundsStoreEvent } from './_battlegrounds-store-event';

export class BgsShowPostMatchStatsEvent extends BattlegroundsStoreEvent {
	constructor() {
		super('BgsShowPostMatchStatsEvent');
	}
}
