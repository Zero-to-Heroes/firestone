import { BattlegroundsStoreEvent } from './_battlegrounds-store-event';

export class BgsTripleCreatedEvent extends BattlegroundsStoreEvent {
	public static eventName = 'BgsTripleCreatedEvent' as const;
	constructor(public readonly heroCardId: string, public readonly playerId: number) {
		super('BgsTripleCreatedEvent');
	}
}
