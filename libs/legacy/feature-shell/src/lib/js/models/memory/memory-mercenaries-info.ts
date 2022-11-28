import { RarityTYpe, TagRole } from '@firestone-hs/reference-data';

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
	readonly TurnsTaken: number;
}

export interface MemoryMercenary {
	readonly Id: number;
	readonly Level: number;
	readonly Abilities: readonly MemoryMercenaryAbility[];
	readonly Equipments: readonly MemoryMercenaryEquipment[];
	readonly Skins: readonly MemoryMercenarySkin[];
	readonly TreasureCardDbfIds: readonly number[];
	readonly Attack: number;
	readonly Health: number;
	readonly CurrencyAmount: number;
	readonly Experience: number;
	readonly IsFullyUpgraded: boolean;
	readonly Owned: boolean;
	readonly Premium: number;
	readonly Rarity: RarityTYpe;
	readonly Role: TagRole;
	readonly Loadout: MercenaryLoadout;
}

export interface MercenaryLoadout {
	readonly ArtVariationPremium: number;
	readonly ArtVariation: MercenaryLoadoutArtVariation;
	readonly Equipment: MercenaryLoadoutEquipment;
}

export interface MercenaryLoadoutArtVariation {
	readonly Id: number;
	readonly CardDbfId: number;
	readonly Default: boolean;
	readonly MercenaryId: number;
}

export interface MercenaryLoadoutEquipment {
	readonly Id: number;
	readonly Name: string;
}

export interface MemoryMercenarySkin {
	readonly Id: number;
	readonly CardDbfId: number;
	readonly Default: boolean;
	// readonly Equipped: boolean;
	readonly Premium: number;
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
