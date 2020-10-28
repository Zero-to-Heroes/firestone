import { ReferencePlayerClass } from '@firestone-hs/reference-data/lib/models/reference-cards/reference-player-class';

export interface DuelsPlayerStats {
	readonly heroStats: readonly DuelsHeroPlayerStat[];
	readonly heroPowerStats: readonly DuelsHeroPlayerStat[];
	readonly signatureTreasureStats: readonly DuelsHeroPlayerStat[];
	readonly treasureStats: readonly DuelsTreasureStat[];
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

export interface DuelsTreasureStat {
	readonly periodStart: string;
	readonly cardId: string;
	readonly globalTotalOffered: number;
	readonly globalTotalPicked: number;
	readonly globalOfferingRate: number;
	readonly globalPickRate: number;
	readonly statsForClass: readonly DuelsTreasureStatForClass[];
}

export interface DuelsTreasureStatForClass {
	readonly periodStart: string;
	readonly cardId: string;
	readonly playerClass: string;
	readonly globalTotalOffered: number;
	readonly globalTotalPicked: number;
	readonly globalOfferingRate: number;
	readonly globalPickRate: number;
}
