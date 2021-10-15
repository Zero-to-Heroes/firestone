export interface MemoryMercenariesInfo {
	readonly PvpRating: number;
	readonly Map: MemoryMercenariesMap;
}

export interface MemoryMercenariesMap {
	readonly BountyId: number;
	readonly MapId: number;
	readonly Seed: number;
	readonly PlayerTeamId: number;
	readonly PlayerTeamName: string;
	readonly PlayerTeam: readonly MemoryMercenary[];
	readonly PlayerTeamMercIds: readonly number[];
	readonly DeadMercIds: readonly number[];
	readonly CurrentStep: number;
	readonly MaxStep: number;
}

export interface MemoryMercenary {
	readonly Id: number;
	readonly Level: number;
	readonly Abilities: readonly MemoryMercenaryAbility[];
	readonly Equipments: readonly MemoryMercenaryEquipment[];
	readonly TreasureCardDbfIds: readonly number[];
}

export interface MemoryMercenaryAbility {
	readonly CardId: string;
	readonly Tier: number;
}

export interface MemoryMercenaryEquipment {
	readonly Id: number;
	readonly Owned: boolean;
	readonly Equipped: boolean;
	readonly Tier: number;
}
