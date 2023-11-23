export type ArenaCategoryType = 'arena-runs' | 'class-tier-list' | 'card-stats';

export interface ArenaCategory {
	readonly id: ArenaCategoryType;
	readonly name: string;
}
