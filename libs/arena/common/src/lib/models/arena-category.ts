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
export const ARENA_REVAMP_BUILD_NUMBER = 221908;
export const ARENA_REVAMP_RELEASE_DATE = new Date('2025-06-02T18:00:00Z');
