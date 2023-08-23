import { BattlegroundsStoreEvent } from './_battlegrounds-store-event';

export class BgsRewardGainedEvent extends BattlegroundsStoreEvent {
	constructor(
		public readonly heroCardId: string,
		public readonly playerId: number,
		public readonly isHeroPowerReward: boolean,
	) {
		super('BgsRewardGainedEvent');
	}
}
