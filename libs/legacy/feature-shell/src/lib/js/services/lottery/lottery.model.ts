import { NonFunctionProperties } from '@firestone/shared/framework/common';

export class LotteryState {
	readonly shouldTrack: boolean = true;
	readonly lastUpdateDate: string;

	readonly resourcesUsedThisTurn: number = 0;
	readonly totalResourcesUsed: number = 0;
	readonly quilboarsPlayed: number = 0;
	readonly spellsPlayed: number = 0;

	private config: LotterySeasonConfig;

	public static create(
		base: Partial<NonFunctionProperties<LotteryState>>,
		config: LotterySeasonConfig,
	): LotteryState {
		return Object.assign(new LotteryState(), base, { config: config });
	}

	public update(base: Partial<NonFunctionProperties<LotteryState>>): LotteryState {
		return Object.assign(new LotteryState(), this, base);
	}

	public currentPoints(): number {
		console.debug('[lottery] getting points', this);
		return (
			this.pointsForStat(this.config.resourceStat) +
			this.pointsForStat(this.config.constructedStat) +
			this.pointsForStat(this.config.battlegroundsStat)
		);
	}

	private pointsForStat(stat: LotteryConfigResourceStat): number {
		const value = this[stat.type];
		return Math.floor(value * stat.points);
	}
}

export interface LotteryConfig {
	[season: string]: LotterySeasonConfig;
}

export interface LotterySeasonConfig {
	readonly resourceStat: LotteryConfigResourceStat;
	readonly constructedStat: LotteryConfigResourceStat;
	readonly battlegroundsStat: LotteryConfigResourceStat;
}

export interface LotteryConfigResourceStat {
	readonly type: LotteryConfigResourceStatType;
	readonly points: number;
}

export type LotteryConfigResourceStatType = 'totalResourcesUsed' | 'quilboarsPlayed' | 'spellsPlayed';
