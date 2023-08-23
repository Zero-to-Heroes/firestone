import { BattlegroundsStoreEvent } from './_battlegrounds-store-event';

export class BgsArmorChangedEvent extends BattlegroundsStoreEvent {
	constructor(
		public readonly heroCardId: string,
		public readonly playerId: number,
		public readonly totalArmor: number,
	) {
		super('BgsArmorChangedEvent');
	}
}
