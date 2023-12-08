export interface BoostersInfo {
	readonly Boosters: readonly BoosterInfo[];
}

export interface BoosterInfo {
	readonly BoosterId: number;
	readonly Count: number;
	readonly EverGrantedCount: number;
}
