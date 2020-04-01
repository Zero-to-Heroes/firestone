export interface PlayerInfo {
	readonly name: string;
	// readonly cardId: string;
	readonly cardBackId: number;
	readonly standard: Rank;
	readonly wild: Rank;
	// readonly standardRank: number;
	// readonly standardLegendRank: number;
	// readonly wildRank: number;
	// readonly wildLegendRank: number;
}

export interface Rank {
	leagueId: number;
	rankValue: number;
	legendRank: number;
}
