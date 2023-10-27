export interface StatsCategory {
	readonly id: StatsCategoryType;
	readonly name: string;
}

export type StatsCategoryType = 'xp-graph' | 'match-stats';
