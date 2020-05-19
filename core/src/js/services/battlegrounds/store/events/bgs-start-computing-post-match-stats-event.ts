import { BattlegroundsStoreEvent } from './_battlegrounds-store-event';

export class BgsStartComputingPostMatchStatsEvent extends BattlegroundsStoreEvent {
	constructor() {
		super('BgsStartComputingPostMatchStatsEvent');
	}
}
