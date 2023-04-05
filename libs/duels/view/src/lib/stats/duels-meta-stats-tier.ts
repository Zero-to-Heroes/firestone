export interface DuelsMetaStatsTier {
	readonly id: DuelsMetaStatsTierLevel | null;
	readonly label: string | null;
	readonly tooltip: string | null;
	readonly items: readonly DuelsMetaStats[];
}

export interface DuelsMetaStats {
	readonly cardId: string;
	readonly cardName: string;
	readonly globalRunsPlayed: number;
	readonly globalWinrate: number;
	readonly globalPopularity: number;
	readonly placementDistribution: readonly { wins: number; runs: number; percentage: number }[];
	readonly playerWinrate?: number;
	readonly playerRunsPlayed?: number;
}

export type DuelsMetaStatsTierLevel = 'S' | 'A' | 'B' | 'C' | 'D' | 'E';

// TODO: move this to a non-view lib later on
export type DuelsHeroSortFilterType = 'player-winrate' | 'global-winrate' | 'games-played';
export type DuelsDeckSortFilterType = 'last-played' | 'winrate';
