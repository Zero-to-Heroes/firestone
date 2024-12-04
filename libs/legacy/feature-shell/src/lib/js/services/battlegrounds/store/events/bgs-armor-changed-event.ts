import { BattlegroundsStoreEvent } from './_battlegrounds-store-event';

export class BgsArmorChangedEvent extends BattlegroundsStoreEvent {
	public static eventName = 'BgsArmorChangedEvent' as const;
	constructor(
		public readonly heroCardId: string,
		public readonly playerId: number,
		public readonly totalArmor: number,
	) {
		super('BgsArmorChangedEvent');
	}
}
