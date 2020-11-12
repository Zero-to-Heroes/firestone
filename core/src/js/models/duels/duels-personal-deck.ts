export interface DuelsDeckSummary {
	readonly initialDeckList: string;
	readonly heroCardId: string;
	readonly global: DuelsDeckStatInfo;
	readonly deckStatsForTypes: readonly DuelsDeckSummaryForType[];
}

export interface DuelsDeckSummaryForType {
	readonly type: 'duels' | 'paid-duels';
	readonly global: DuelsDeckStatInfo;
}

export interface DuelsDeckStatInfo {
	readonly totalRunsPlayed: number;
	readonly totalMatchesPlayed: number;
	readonly averageWinsPerRun: number;
	readonly winsDistribution: readonly { winNumber: number; value: number }[];
	readonly winrate: number;
	readonly netRating: number;
}
