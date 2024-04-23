export interface MemoryBgsTeamInfo {
	readonly Player: MemoryBgsPlayerInfo;
	readonly Teammate: MemoryBgsPlayerInfo;
}

export interface MemoryBgsPlayerInfo {
	readonly Hero: BgsEntity;
	readonly HeroPower: BgsEntity;
	readonly Board: readonly BgsEntity[];
	readonly Hand: readonly BgsEntity[];
	readonly Secrets: readonly BgsEntity[];
}

export interface BgsEntity {
	readonly CardId: string;
	readonly Tags: readonly EntityTag[];
	readonly Enchantments: readonly BgsEntity[];
}

export interface EntityTag {
	readonly Name: number;
	readonly Value: number;
}
