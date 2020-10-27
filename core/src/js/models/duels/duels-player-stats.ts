import { ReferencePlayerClass } from '@firestone-hs/reference-data/lib/models/reference-cards/reference-player-class';

export interface DuelsPlayerStats {
	readonly heroStats: readonly DuelsHeroPlayerStat[];
	readonly heroPowerStats: readonly DuelsHeroPlayerStat[];
	readonly signatureTreasureStats: readonly DuelsHeroPlayerStat[];
}

export interface DuelsHeroPlayerStat {
	readonly periodStart: string;
	readonly cardId: string;
	readonly heroClass: ReferencePlayerClass;
	readonly globalTotalMatches: number;
	readonly globalPopularity: number;
	readonly globalWinrate: number;
	readonly playerTotalMatches: number;
	readonly playerPopularity: number;
	readonly playerWinrate: number;
}
