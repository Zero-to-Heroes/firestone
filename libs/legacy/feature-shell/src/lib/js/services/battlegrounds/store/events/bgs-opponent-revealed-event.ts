import { BattlegroundsStoreEvent } from './_battlegrounds-store-event';

export class BgsOpponentRevealedEvent extends BattlegroundsStoreEvent {
	public static eventName = 'BgsOpponentRevealedEvent' as const;
	constructor(
		public readonly cardId: string,
		public readonly playerId: number,
		public readonly leaderboardPlace: number,
		public readonly health: number,
		public readonly armor: number,
	) {
		super('BgsOpponentRevealedEvent');
	}
}
