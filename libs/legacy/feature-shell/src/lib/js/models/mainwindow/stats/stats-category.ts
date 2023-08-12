export interface StatsCategory {
	readonly id: StatsCategoryType;
	readonly name: string;
	readonly icon: string;
	readonly enabled: boolean;
	readonly disabledTooltip?: string;
}

export type StatsCategoryType = 'xp-graph' | 'match-stats';
