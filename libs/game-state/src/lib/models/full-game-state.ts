export interface FullGameState {
	readonly ActivePlayerId: number;
	readonly Player: PlayerGameState;
	readonly Opponent: PlayerGameState;
}

export interface PlayerGameState {
	readonly Hero: EntityGameState;
	readonly Weapon: EntityGameState;
	readonly Hand: readonly EntityGameState[];
	readonly Board: readonly EntityGameState[];
	readonly Deck: readonly EntityGameState[];
	readonly LettuceAbilities: readonly EntityGameState[];
}

export interface EntityGameState {
	readonly entityId: number;
	readonly cardId: string;
	readonly attack: number;
	readonly health: number;
	readonly durability: number;
	readonly tags: readonly TagGameState[];
	readonly enchantments: readonly EnchantmentGameState[];
}

export interface EnchantmentGameState {
	readonly entityId: number;
	readonly cardId: string;
	readonly tags: readonly TagGameState[];
}
export interface TagGameState {
	readonly Name: number;
	readonly Value: number;
}
