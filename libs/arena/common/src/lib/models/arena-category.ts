export type ArenaCategoryType = 'arena-runs' | 'class-tier-list';

export interface ArenaCategory {
	readonly id: ArenaCategoryType;
	readonly name: string;
}
