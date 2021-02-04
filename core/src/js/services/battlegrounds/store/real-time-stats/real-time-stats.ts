import { GameType } from '@firestone-hs/reference-data';

export class RealTimeStatsState {
	public gameType: GameType;

	public currentTurn: number;
	public totalBattlesWon: number;
	public totalBattlesTied: number;
	public totalBattlesLost: number;
	public totalDamageDealtByMainMinions: number = 0;
	public totalDamageTakenByMainMinions: number = 0;
	public totalDamageDealtByMainHero: number = 0;
	public totalDamageTakenByMainHero: number = 0;

	public static create(base: RealTimeStatsState): RealTimeStatsState {
		return Object.assign(new RealTimeStatsState(), base);
	}

	public update(base: RealTimeStatsState): RealTimeStatsState {
		return Object.assign(new RealTimeStatsState(), this, base);
	}
}
