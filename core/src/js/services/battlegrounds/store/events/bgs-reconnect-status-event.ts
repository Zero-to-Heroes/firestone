import { BattlegroundsStoreEvent } from './_battlegrounds-store-event';

export class BgsReconnectStatusEvent extends BattlegroundsStoreEvent {
	constructor(public readonly isReconnectOngoing: boolean) {
		super('BgsReconnectStatusEvent');
	}
}
