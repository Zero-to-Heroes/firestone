export interface ArenaClassSummary {
	readonly className: string;
	readonly classIcon: string;
	readonly totalRuns: number | null;
	readonly averageWinsPerRun: number | null;
	readonly gamesPlayed: number | null;
}
