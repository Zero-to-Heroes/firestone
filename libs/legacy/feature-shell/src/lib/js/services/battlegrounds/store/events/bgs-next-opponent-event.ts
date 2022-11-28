import { BattlegroundsStoreEvent } from './_battlegrounds-store-event';

export class BgsNextOpponentEvent extends BattlegroundsStoreEvent {
	constructor(public readonly cardId) {
		super('BgsNextOpponentEvent');
	}
}
