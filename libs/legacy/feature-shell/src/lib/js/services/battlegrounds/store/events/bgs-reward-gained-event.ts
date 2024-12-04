import { BattlegroundsStoreEvent } from './_battlegrounds-store-event';

export class BgsRewardGainedEvent extends BattlegroundsStoreEvent {
	public static eventName = 'BgsRewardGainedEvent' as const;
	constructor(
		public readonly heroCardId: string,
		public readonly playerId: number,
		public readonly rewardDbfId: number,
		public readonly isHeroPowerReward: boolean,
	) {
		super('BgsRewardGainedEvent');
	}
}
