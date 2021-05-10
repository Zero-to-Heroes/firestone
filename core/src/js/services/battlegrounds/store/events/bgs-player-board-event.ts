import { BattlegroundsStoreEvent } from './_battlegrounds-store-event';

export class BgsPlayerBoardEvent extends BattlegroundsStoreEvent {
	constructor(public readonly playerBoard: PlayerBoard, public readonly opponentBoard: PlayerBoard) {
		super('BgsPlayerBoardEvent');
	}
}

export interface PlayerBoard {
	readonly heroCardId: string;
	readonly board: readonly any[];
	readonly secrets: readonly any[];
	readonly hero: any;
	readonly heroPowerCardId: string;
	readonly heroPowerUsed: boolean;
}
