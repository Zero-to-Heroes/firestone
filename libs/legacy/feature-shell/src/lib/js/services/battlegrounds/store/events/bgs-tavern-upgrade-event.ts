import { BattlegroundsStoreEvent } from './_battlegrounds-store-event';

export class BgsTavernUpgradeEvent extends BattlegroundsStoreEvent {
	public static eventName = 'BgsTavernUpgradeEvent' as const;
	constructor(
		public readonly heroCardId: string,
		public readonly playerId: number,
		public readonly tavernTier: number,
	) {
		super('BgsTavernUpgradeEvent');
	}
}
