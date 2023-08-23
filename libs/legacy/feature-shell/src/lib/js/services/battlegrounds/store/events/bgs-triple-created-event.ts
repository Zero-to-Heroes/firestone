import { BattlegroundsStoreEvent } from './_battlegrounds-store-event';

export class BgsTripleCreatedEvent extends BattlegroundsStoreEvent {
	constructor(public readonly heroCardId: string, public readonly playerId: number) {
		super('BgsTripleCreatedEvent');
	}
}
