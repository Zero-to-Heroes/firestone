import { BattlegroundsStoreEvent } from './_battlegrounds-store-event';

export class BgsOpponentRevealedEvent extends BattlegroundsStoreEvent {
	constructor(public readonly cardId: string, public readonly leaderboardPlace: number) {
		super('BgsOpponentRevealedEvent');
	}
}
