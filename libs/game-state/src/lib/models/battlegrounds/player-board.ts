import { BgsHeroPower, BoardTrinket } from '@firestone-hs/simulate-bgs-battle/dist/bgs-player-entity';

export interface PlayerBoard {
	readonly playerId: number;
	readonly heroCardId: string;
	readonly board: readonly PlayerBoardEntity[];
	readonly hand: readonly PlayerBoardEntity[];
	readonly secrets: readonly PlayerBoardEntity[];
	readonly trinkets: readonly BoardTrinket[]; // The c# parser returns an object compatible with the BoardTrinket interface
	readonly hero: PlayerBoardHeroEntity;
	readonly heroPowers: readonly BgsHeroPower[];
	// readonly heroPowerCardId: string;
	// readonly heroPowerUsed: boolean;
	// readonly heroPowerInfo: number;
	// readonly heroPowerInfo2: number;
	readonly questEntities: readonly {
		CardId: string;
		RewardDbfId: number;
		ProgressCurrent: number;
		ProgressTotal: number;
	}[];
	readonly questRewards: readonly string[];
	readonly questRewardEntities: readonly {
		entityId: number;
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
