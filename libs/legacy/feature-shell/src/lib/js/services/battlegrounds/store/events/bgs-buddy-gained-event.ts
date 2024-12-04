import { BattlegroundsStoreEvent } from './_battlegrounds-store-event';

export class BgsBuddyGainedEvent extends BattlegroundsStoreEvent {
	public static eventName = 'BgsBuddyGainedEvent' as const;
	constructor(
		public readonly heroCardId: string,
		public readonly playerId: number,
		public readonly totalBuddies: number,
	) {
		super('BgsBuddyGainedEvent');
	}
}
