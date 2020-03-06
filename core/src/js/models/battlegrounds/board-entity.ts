export interface BoardEntity {
	entityId: number;
	cardId: string;
	attack: number;
	health: number;
	taunt: boolean;
	divineShield: boolean;
	poisonous: boolean; // TODO
	// Because Lich King can give Reborn to a non-reborn minion
	reborn: boolean;
	cleave: boolean;
	windfury: boolean;
	megaWindfury: boolean;
	enchantments: readonly { cardId: string; originEntityId: number }[];

	attacksPerformed?: number;
	previousAttack?: number;
	lastAffectedByEntity?: BoardEntity;
	attacking?: boolean;
}
