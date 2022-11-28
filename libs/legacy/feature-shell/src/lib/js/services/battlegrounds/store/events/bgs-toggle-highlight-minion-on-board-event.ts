import { BattlegroundsStoreEvent } from './_battlegrounds-store-event';

export class BgsToggleHighlightMinionOnBoardEvent extends BattlegroundsStoreEvent {
	constructor(public readonly cardId: string) {
		super('BgsToggleHighlightMinionOnBoardEvent');
	}
}
