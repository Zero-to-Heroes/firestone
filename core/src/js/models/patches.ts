export interface PatchesConfig {
	readonly patches: readonly PatchInfo[];
	readonly currentConstructedMetaPatch: number;
	readonly currentBattlegroundsMetaPatch: number;
	readonly currentDuelsMetaPatch: number;
	readonly currentArenaMetaPatch: number;
}

export interface PatchInfo {
	readonly number: number;
	readonly version: string;
	readonly name: string;
	readonly date: string;
}
