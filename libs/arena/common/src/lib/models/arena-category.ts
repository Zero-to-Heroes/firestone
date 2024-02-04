export type ArenaCategoryType = 'arena-runs' | 'class-tier-list' | 'card-stats' | 'arena-deck-details';

export interface ArenaCategory {
	readonly id: ArenaCategoryType;
	readonly name: string;
}
