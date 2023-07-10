import { NonFunctionProperties } from '@firestone/shared/framework/common';

export class LotteryState {
	readonly shouldTrack: boolean = true;
	readonly lastUpdateDate: string;

	readonly resourcesUsedThisTurn: number = 0;
	readonly totalResourcesUsed: number = 0;

	readonly spellsPlayed: number = 0;
	readonly damageWithSpells: number = 0;

	readonly quilboarsPlayed: number = 0;
	readonly beastsPlayed: number = 0;
	readonly demonsPlayed: number = 0;
	readonly dragonsPlayed: number = 0;
	readonly mechsPlayed: number = 0;
	readonly murlocsPlayed: number = 0;
	readonly piratesPlayed: number = 0;
	readonly elementalsPlayed: number = 0;
	readonly nagasPlayed: number = 0;
	readonly undeadPlayed: number = 0;

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

	public startDate(): Date {
		return new Date(this.config.startDate);
	}

	public endDate(): Date {
		const startDate = new Date(this.config.startDate);
		const endDate = new Date(startDate.getTime() + this.config.durationInDays * 24 * 60 * 60 * 1000);
		return endDate;
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
			case 'beastsPlayed':
				return this.beastsPlayed;
			case 'demonsPlayed':
				return this.demonsPlayed;
			case 'dragonsPlayed':
				return this.dragonsPlayed;
			case 'mechsPlayed':
				return this.mechsPlayed;
			case 'murlocsPlayed':
				return this.murlocsPlayed;
			case 'piratesPlayed':
				return this.piratesPlayed;
			case 'elementalsPlayed':
				return this.elementalsPlayed;
			case 'nagasPlayed':
				return this.nagasPlayed;
			case 'undeadPlayed':
				return this.undeadPlayed;
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
	readonly id: number;
	readonly seasonName: string;
	readonly startDate: string;
	readonly durationInDays: number;
	readonly resourceStat: LotteryConfigResourceStat;
	readonly constructedStat: LotteryConfigResourceStat;
	readonly battlegroundsStat: LotteryConfigResourceStat;
}

export interface LotteryConfigResourceStat {
	readonly type: LotteryConfigResourceStatType;
	readonly points: number;
}

export type LotteryConfigResourceStatType =
	| 'totalResourcesUsed'
	| 'spellsPlayed'
	| 'quilboarsPlayed'
	| 'beastsPlayed'
	| 'demonsPlayed'
	| 'dragonsPlayed'
	| 'mechsPlayed'
	| 'murlocsPlayed'
	| 'piratesPlayed'
	| 'elementalsPlayed'
	| 'nagasPlayed'
	| 'undeadPlayed';
