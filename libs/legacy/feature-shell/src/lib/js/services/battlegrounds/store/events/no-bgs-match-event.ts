import { BattlegroundsStoreEvent } from './_battlegrounds-store-event';

export class NoBgsMatchEvent extends BattlegroundsStoreEvent {
	public static eventName = 'NoBgsMatchEvent' as const;

	constructor() {
		super(NoBgsMatchEvent.eventName);
	}
}
