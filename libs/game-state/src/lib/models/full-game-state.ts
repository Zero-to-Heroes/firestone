import { GameTag } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';

export interface FullGameState {
	readonly ActivePlayerId: number;
	readonly Player: PlayerGameState;
	readonly Opponent: PlayerGameState;
}

export interface PlayerGameState {
	readonly PlayerEntity: EntityGameState;
	readonly Hero: EntityGameState;
	readonly Weapon: EntityGameState;
	readonly Hand: readonly EntityGameState[];
	readonly Board: readonly EntityGameState[];
	readonly Secrets: readonly EntityGameState[];
	readonly Deck: readonly EntityGameState[];
	readonly AllEntities: readonly EntityGameState[];
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
export const toReadableEntity = (entity: EntityGameState, allCards?: CardsFacadeService) => ({
	...entity,
	name: allCards?.getCard(entity.cardId)?.name ?? entity.cardId,
	tags: entity.tags.map((t) => ({
		...t,
		Name: GameTag[t.Name] ?? t.Name,
	})),
});

export interface EnchantmentGameState {
	readonly entityId: number;
	readonly cardId: string;
	readonly tags: readonly TagGameState[];
}
export interface TagGameState {
	readonly Name: number;
	readonly Value: number;
}
