export interface MercenariesPersonalHeroesSortCriteria {
	readonly criteria: MercenariesPersonalHeroesSortCriteriaType;
	readonly direction: MercenariesPersonalHeroesSortCriteriaDirection;
}

export type MercenariesPersonalHeroesSortCriteriaType =
	| 'level'
	| 'role'
	| 'name'
	| 'xp-in-level'
	| 'coins-left'
	| 'coins-needed-to-max'
	| 'coins-to-farm-to-max'
	| 'task-progress';
export type MercenariesPersonalHeroesSortCriteriaDirection = 'asc' | 'desc';
