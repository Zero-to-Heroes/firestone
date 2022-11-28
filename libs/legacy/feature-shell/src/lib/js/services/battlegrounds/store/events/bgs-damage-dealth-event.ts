import { BattlegroundsStoreEvent } from './_battlegrounds-store-event';

export class BgsDamageDealtEvent extends BattlegroundsStoreEvent {
	constructor(public readonly heroCardId: string, public readonly damage: number) {
		super('BgsDamageDealtEvent');
	}
}
