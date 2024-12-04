import { BattlegroundsStoreEvent } from './_battlegrounds-store-event';

export class BgsHeroSelectedEvent extends BattlegroundsStoreEvent {
	public static eventName = 'BgsHeroSelectedEvent' as const;
	constructor(
		public readonly cardId: string,
		public readonly playerId: number,
		public readonly additionalData?: {
			leaderboardPlace: number;
			health: number;
			damage: number;
			armor: number;
			tavernLevel: number;
			nextOpponentCardId: string;
			nextOpponentPlayerId: number;
		},
	) {
		super('BgsHeroSelectedEvent');
	}
}
