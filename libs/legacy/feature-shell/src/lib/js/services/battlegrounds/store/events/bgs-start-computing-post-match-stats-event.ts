import { BattlegroundsStoreEvent } from './_battlegrounds-store-event';

export class BgsStartComputingPostMatchStatsEvent extends BattlegroundsStoreEvent {
	public static eventName = 'BgsStartComputingPostMatchStatsEvent' as const;
	constructor() {
		super('BgsStartComputingPostMatchStatsEvent');
	}
}
