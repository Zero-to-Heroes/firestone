export interface PlayerBoard {
	readonly playerId: number;
	readonly heroCardId: string;
	readonly board: readonly PlayerBoardEntity[];
	readonly hand: readonly PlayerBoardEntity[];
	readonly secrets: readonly PlayerBoardEntity[];
	readonly hero: PlayerBoardHeroEntity;
	readonly heroPowerCardId: string;
	readonly heroPowerUsed: boolean;
	readonly heroPowerInfo: number;
	readonly heroPowerInfo2: number;
	readonly questRewards: readonly string[];
	readonly questRewardEntities: readonly {
		cardId: string;
		avengeDefault?: number;
		avengeCurrent?: number;
		scriptDataNum1: number;
	}[];
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
	readonly Enchantments: readonly {
		EntityId: number;
		CardId: string;
		TagScriptDataNum1: number;
		TagScriptDataNum2: number;
	}[];
}
