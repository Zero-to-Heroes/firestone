import { GameType } from '@firestone-hs/reference-data';

export class RealTimeStatsState {
	public gameType: GameType;

	public totalDamageDealtByMainMinions: number = 0;
	public totalDamageTakenByMainMinions: number = 0;
	public totalDamageDealtByMainHero: number = 0;
	public totalDamageTakenByMainHero: number = 0;
	public maxDamageDealtByMainHero: number = 0;
	public resourcesAvailableThisTurn: number = 0;
	public resourcesUsedThisTurn: number = 0;
	public resourcesWastedPerTurn: { [turn: number]: number } = {};

	// BG specific
	public currentTurn: number;
	public totalBattlesWon: number = 0;
	public totalBattlesTied: number = 0;
	public totalBattlesLost: number = 0;
	public currentWinStreak: number = 0;
	public highestWinStreak: number = 0;
	public bgsMaxBoardStats: number = 0;
	public triplesPerHero: { [heroCardId: string]: number } = {};

	public static create(base: RealTimeStatsState): RealTimeStatsState {
		return Object.assign(new RealTimeStatsState(), base);
	}

	public update(base: RealTimeStatsState): RealTimeStatsState {
		return Object.assign(new RealTimeStatsState(), this, base);
	}
}
