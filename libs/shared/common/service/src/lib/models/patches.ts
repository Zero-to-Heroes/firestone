export interface PatchesConfig {
	readonly patches: readonly PatchInfo[];
	readonly currentConstructedMetaPatch: number;
	readonly currentTwistMetaPatch: number;
	readonly currentBattlegroundsMetaPatch: number;
	readonly currentArenaMetaPatch: number;
	readonly currentArenaSeasonPatch: number;
}

export interface PatchInfo {
	readonly number: number;
	readonly version: string;
	readonly name: string;
	readonly date: string;
	readonly hasNewBuildNumber: boolean;
}
