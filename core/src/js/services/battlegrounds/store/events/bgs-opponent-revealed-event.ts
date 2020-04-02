import { BattlegroundsStoreEvent } from './_battlegrounds-store-event';

export class BgsOpponentRevealedEvent extends BattlegroundsStoreEvent {
	constructor(public readonly cardId) {
		super('BgsOpponentRevealedEvent');
	}
}
