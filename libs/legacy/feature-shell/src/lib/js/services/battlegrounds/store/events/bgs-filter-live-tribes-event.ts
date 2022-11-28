import { BattlegroundsStoreEvent } from './_battlegrounds-store-event';

export class BgsFilterLiveTribesEvent extends BattlegroundsStoreEvent {
	constructor(public readonly filterByLiveTribes: boolean) {
		super('BgsFilterLiveTribesEvent');
	}
}
