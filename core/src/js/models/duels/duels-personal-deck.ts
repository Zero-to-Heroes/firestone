import { DuelsRun } from './duels-run';

export interface DuelsDeckSummary {
	readonly initialDeckList: string;
	readonly deckName: string;
	readonly playerClass: string;
	readonly heroCardId: string;
	readonly global: DuelsDeckStatInfo;
	readonly heroPowerStats: readonly HeroPowerDuelsDeckStatInfo[];
	readonly signatureTreasureStats: readonly SignatureTreasureDuelsDeckStatInfo[];
	readonly treasureStats: readonly TreasureDuelsDeckStatInfo[];
	readonly lootStats: readonly LootDuelsDeckStatInfo[];
	readonly deckStatsForTypes: readonly DuelsDeckSummaryForType[];
	readonly runs: readonly DuelsRun[];
	readonly hidden: boolean;
	readonly isPersonalDeck?: boolean;
}

export interface DuelsDeckSummaryForType {
	readonly type: 'duels' | 'paid-duels';
	readonly global: DuelsDeckStatInfo;
	readonly heroPowerStats: readonly HeroPowerDuelsDeckStatInfo[];
	readonly signatureTreasureStats: readonly SignatureTreasureDuelsDeckStatInfo[];
	readonly treasureStats: readonly TreasureDuelsDeckStatInfo[];
}

export interface DuelsDeckStatInfo {
	readonly totalRunsPlayed: number;
	readonly totalMatchesPlayed: number;
	readonly averageWinsPerRun: number;
	readonly winsDistribution: readonly { winNumber: number; value: number }[];
	readonly winrate: number;
	readonly netRating: number;
}

export interface HeroPowerDuelsDeckStatInfo extends DuelsDeckStatInfo {
	readonly heroPowerCardId: string;
}

export interface SignatureTreasureDuelsDeckStatInfo extends DuelsDeckStatInfo {
	readonly signatureTreasureCardId: string;
}

export interface TreasureDuelsDeckStatInfo extends DuelsDeckStatInfo {
	readonly cardId: string;
}

export interface LootDuelsDeckStatInfo extends DuelsDeckStatInfo {
	readonly cardId: string;
}
