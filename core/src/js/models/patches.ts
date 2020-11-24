export interface PatchesConfig {
	readonly patches: readonly PatchInfo[];
	readonly currentBattlegroundsMetaPatch: number;
	readonly currentDuelsMetaPatch: number;
}

export interface PatchInfo {
	readonly number: number;
	readonly version: string;
	readonly name: string;
	readonly date: string;
}
