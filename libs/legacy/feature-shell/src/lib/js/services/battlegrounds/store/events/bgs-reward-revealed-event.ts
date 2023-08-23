import { BattlegroundsStoreEvent } from './_battlegrounds-store-event';

export class BgsRewardRevealedEvent extends BattlegroundsStoreEvent {
	constructor(
		public readonly heroCardId: string,
		public readonly playerId: number,
		public readonly rewardDbfId: number,
		public readonly isHeroPowerReward: boolean,
	) {
		super('BgsRewardRevealedEvent');
	}
}
