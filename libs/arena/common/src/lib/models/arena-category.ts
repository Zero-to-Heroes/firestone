export type ArenaCategoryType =
	| 'arena-runs'
	| 'arena-stats'
	| 'class-tier-list'
	| 'card-stats'
	| 'arena-deck-details'
	| 'arena-high-wins-runs';

export interface ArenaCategory {
	readonly id: ArenaCategoryType;
	readonly name: string;
}
