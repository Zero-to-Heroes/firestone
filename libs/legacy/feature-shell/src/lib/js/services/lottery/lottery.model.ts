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

	public resourceStatKey(): LotteryConfigResourceStatType {
		return this.config.resourceStat.type;
	}

	public battlegroundsStatKey(): LotteryConfigResourceStatType {
		return this.config.battlegroundsStat.type;
	}

	public constructedStatKey(): LotteryConfigResourceStatType {
		return this.config.constructedStat.type;
	}

	public statValue(statKey: LotteryConfigResourceStatType): number {
		switch (statKey) {
			case 'totalResourcesUsed':
				return this.totalResourcesUsed + this.resourcesUsedThisTurn;
			case 'quilboarsPlayed':
				return this.quilboarsPlayed;
			case 'spellsPlayed':
				return this.spellsPlayed;
			default:
				return 0;
		}
	}

	public pointsGainedForStat(statKey: LotteryConfigResourceStatType): number {
		return this.config.resourceStat.type === statKey
			? this.config.resourceStat.points
			: this.config.battlegroundsStat.type === statKey
			? this.config.battlegroundsStat.points
			: this.config.constructedStat.points;
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

// Don't fix the typo in Quilboars, as it would break backward compatibility
export type LotteryConfigResourceStatType = 'totalResourcesUsed' | 'quilboarsPlayed' | 'spellsPlayed';
