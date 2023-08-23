import { BattlegroundsStoreEvent } from './_battlegrounds-store-event';

export class BgsBattleResultEvent extends BattlegroundsStoreEvent {
	constructor(
		public readonly opponentCardId: string,
		public readonly opponentPlayerId: number,
		public readonly result: string,
		public readonly damage: number,
	) {
		super('BgsBattleResultEvent');
	}
}
