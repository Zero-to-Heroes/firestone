import { GameStat } from '../../../models/mainwindow/stats/game-stat';

export interface MercenaryInfo {
	readonly id: string;
	readonly name: string;
	// readonly type: string;
	// readonly rarity: string;
	// readonly race: string;
	// readonly cost: number;
	// readonly attack: number;
	// readonly health: number;
	readonly role: 'caster' | 'fighter' | 'protector';

	readonly globalTotalMatches: number;
	readonly globalWinrate: number;
	readonly globalPopularity: number;
	readonly playerTotalMatches: number;
	readonly playerWinrate: number;
	readonly equipment: readonly MercenaryEquipment[];
	readonly abilities: readonly MercenaryAbility[];
}

export interface MercenaryEquipment {
	readonly cardId: string;
	readonly name: string;
	readonly level: number;

	readonly globalTotalMatches: number;
	readonly globalWinrate: number;
	readonly globalPopularity: number;
	readonly playerTotalMatches: number;
	readonly playerWinrate: number;
}

export interface MercenaryAbility {
	readonly cardId: string;
	readonly name: string;
	readonly level: number;
	readonly speed: number;
	readonly cooldown: number;

	readonly globalTotalMatches: number;
	readonly globalTotalUses: number;
	readonly globalUsePerMatch: number;
	readonly playerTotalMatches: number;
	readonly playerTotalUses: number;
	readonly playerUsePerMatch: number;
}

export interface MercenaryCompositionInfo {
	readonly id: string;
	readonly heroCardIds: readonly string[];
	readonly benches: readonly MercenaryCompositionInfoBench[];

	readonly globalTotalMatches: number;
	readonly globalWinrate: number;
	readonly globalPopularity: number;
	readonly playerTotalMatches: number;
	readonly playerWinrate: number;
}

export interface MercenaryCompositionInfoBench {
	readonly id: string;
	readonly heroCardIds: readonly string[];

	readonly globalTotalMatches: number;
	readonly globalWinrate: number;
	readonly globalPopularity: number;
	readonly playerTotalMatches: number;
	readonly playerWinrate: number;
}

export interface MercenaryPersonalTeamInfo {
	readonly id: string;
	readonly mercenariesCardIds: readonly string[];
	readonly games: readonly GameStat[];
}
