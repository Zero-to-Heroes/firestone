import { BattlegroundsStoreEvent } from './_battlegrounds-store-event';

export class BgsPlayerBoardEvent extends BattlegroundsStoreEvent {
	constructor(
		public readonly heroCardId: string,
		public readonly board: readonly any[],
		public readonly hero: any,
		public readonly heroPowerCardId: string,
		public readonly heroPowerUsed: boolean,
	) {
		super('BgsPlayerBoardEvent');
	}
}
