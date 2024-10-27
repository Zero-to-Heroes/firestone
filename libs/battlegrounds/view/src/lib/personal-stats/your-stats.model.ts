export interface BattlegroundsYourStat {
	readonly cardId: string;
	readonly name: string;
	readonly totalMatches: number;
	readonly averagePosition: number;
	readonly pickRate: number;
	readonly netMmr: number;
	readonly placementDistribution: readonly { readonly placement: number; readonly totalMatches: number }[];
}
