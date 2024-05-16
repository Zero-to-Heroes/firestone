export interface ArenaClassSummary {
	readonly className: string;
	readonly classIcon: string | null;
	readonly totalRuns: number | null;
	readonly averageWinsPerRun: number | null;
	readonly averageWinsPerRunClass: string | null;
	readonly gamesPlayed: number | null;
	readonly winrateClass: string | null;
	readonly winrateFirstClass: string | null;
	readonly winrateCoinClass: string | null;
	readonly winrateStr: string;
	readonly winrateFirstStr: string;
	readonly winrateCoinStr: string;
	readonly totalWins: number;
	readonly totalGamesFirst: number;
	readonly totalWinsFirst: number;
	readonly totalGamesCoin: number;
	readonly totalWinsCoin: number;
	readonly totalTimePlayed: number;
	readonly totalTimePlayedStr: string;
}
