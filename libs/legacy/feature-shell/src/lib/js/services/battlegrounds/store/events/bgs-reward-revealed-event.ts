import { BattlegroundsStoreEvent } from './_battlegrounds-store-event';

export class BgsRewardRevealedEvent extends BattlegroundsStoreEvent {
	public static eventName = 'BgsRewardRevealedEvent' as const;
	constructor(
		public readonly heroCardId: string,
		public readonly playerId: number,
		public readonly rewardDbfId: number,
		public readonly isHeroPowerReward: boolean,
	) {
		super('BgsRewardRevealedEvent');
	}
}
