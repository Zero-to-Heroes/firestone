import { BattlegroundsStoreEvent } from './_battlegrounds-store-event';

export class BgsGlobalInfoUpdatedEvent extends BattlegroundsStoreEvent {
	constructor(public readonly info) {
		super('BgsGlobalInfoUpdatedEvent');
	}
}
