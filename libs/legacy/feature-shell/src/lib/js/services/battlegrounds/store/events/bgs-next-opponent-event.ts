import { BattlegroundsStoreEvent } from './_battlegrounds-store-event';

export class BgsNextOpponentEvent extends BattlegroundsStoreEvent {
	public static eventName = 'BgsNextOpponentEvent' as const;
	constructor(
		public readonly cardId: string,
		public readonly playerId: number,
		public readonly isSameOpponent: boolean,
	) {
		super('BgsNextOpponentEvent');
	}
}
