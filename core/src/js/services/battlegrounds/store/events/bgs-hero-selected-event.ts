import { BattlegroundsStoreEvent } from './_battlegrounds-store-event';

export class BgsHeroSelectedEvent extends BattlegroundsStoreEvent {
	constructor(public readonly cardId) {
		super('BgsHeroSelectedEvent');
	}
}
