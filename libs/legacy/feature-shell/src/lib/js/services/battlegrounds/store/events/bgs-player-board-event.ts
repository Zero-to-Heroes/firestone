import { BattlegroundsStoreEvent } from './_battlegrounds-store-event';

export class BgsPlayerBoardEvent extends BattlegroundsStoreEvent {
	constructor(public readonly playerBoard: PlayerBoard, public readonly opponentBoard: PlayerBoard) {
		super('BgsPlayerBoardEvent');
	}
}

export interface PlayerBoard {
	readonly heroCardId: string;
	readonly board: readonly PlayerBoardEntity[];
	readonly secrets: readonly any[];
	readonly hero: PlayerBoardHeroEntity;
	readonly heroPowerCardId: string;
	readonly heroPowerUsed: boolean;
	readonly heroPowerInfo: number;
	readonly questRewards: readonly string[];
	readonly globalInfo: any; // BgsPlayerGlobalInfo;
}

export interface PlayerBoardHeroEntity {
	readonly CardId: string;
	readonly Entity: number;
	readonly Id: number;
	readonly Tags: readonly { Name: number; Value: number }[];
}

export interface PlayerBoardEntity {
	readonly CardId: string;
	readonly Entity: number;
	readonly Id: number;
	readonly Tags: readonly { Name: number; Value: number }[];
	readonly Enchantments: readonly { EntityId: number; CardId: string }[];
}
