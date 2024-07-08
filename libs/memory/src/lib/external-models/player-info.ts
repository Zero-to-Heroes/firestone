export interface PlayerInfo {
	readonly name: string;
	readonly cardBackId: number;
	readonly standard: Rank;
	readonly wild: Rank;
	readonly classic: Rank;
	readonly twist: Rank;
}

export interface Rank {
	leagueId: number;
	rankValue: number;
	legendRank: number;
	seasonId: number;
	starLevel: number;
}
