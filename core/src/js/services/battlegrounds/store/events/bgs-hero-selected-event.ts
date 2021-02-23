import { BattlegroundsStoreEvent } from './_battlegrounds-store-event';

export class BgsHeroSelectedEvent extends BattlegroundsStoreEvent {
	constructor(
		public readonly cardId,
		public readonly additionalData?: {
			leaderboardPlace: number;
			health: number;
			damage: number;
			tavernLevel: number;
			nextOpponentCardId: number;
		},
	) {
		super('BgsHeroSelectedEvent');
	}
}
