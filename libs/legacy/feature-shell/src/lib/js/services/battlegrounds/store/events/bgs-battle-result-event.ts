import { BattlegroundsStoreEvent } from './_battlegrounds-store-event';

export class BgsBattleResultEvent extends BattlegroundsStoreEvent {
	public static eventName = 'BgsBattleResultEvent' as const;
	constructor(
		public readonly opponentCardId: string,
		public readonly opponentPlayerId: number,
		public readonly result: string,
		public readonly damage: number,
	) {
		super('BgsBattleResultEvent');
	}
}
