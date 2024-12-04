import { BattlegroundsStoreEvent } from './_battlegrounds-store-event';

export class BgsShowPostMatchStatsEvent extends BattlegroundsStoreEvent {
	public static readonly eventName = 'BgsShowPostMatchStatsEvent' as const;
	constructor() {
		super('BgsShowPostMatchStatsEvent');
	}
}
