import { BattlegroundsStoreEvent } from './_battlegrounds-store-event';

export class BgsLeaderboardPlaceEvent extends BattlegroundsStoreEvent {
	public static eventName = 'BgsLeaderboardPlaceEvent' as const;
	constructor(
		public readonly heroCardId: string,
		public readonly playerId: number,
		public readonly leaderboardPlace: number,
	) {
		super('BgsLeaderboardPlaceEvent');
	}
}
