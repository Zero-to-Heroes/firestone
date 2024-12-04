import { BattlegroundsStoreEvent } from './_battlegrounds-store-event';

export class BgsReconnectStatusEvent extends BattlegroundsStoreEvent {
	public static eventName = 'BgsReconnectStatusEvent' as const;
	constructor(public readonly isReconnectOngoing: boolean) {
		super('BgsReconnectStatusEvent');
	}
}
