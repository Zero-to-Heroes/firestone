import { BattlegroundsStoreEvent } from './_battlegrounds-store-event';

export class BgsPlayerBoardEvent extends BattlegroundsStoreEvent {
	constructor(public readonly heroCardId: string, public readonly board: readonly any[], public readonly hero: any) {
		super('BgsPlayerBoardEvent');
	}
}
