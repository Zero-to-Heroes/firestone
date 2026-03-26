import { CardType, GameTag } from '@firestone-hs/reference-data';
import { Tag } from '../models';

export class GameStateShort {
	ActivePlayerId: number = 0;
	Player!: GameStateShortPlayer;
	Opponent!: GameStateShortPlayer;
}

export class GameStateShortPlayer {
	PlayerEntity!: GameStateShortSmallEntity;
	Hero!: GameStateShortSmallEntity;
	Weapon!: GameStateShortSmallEntity;
	Hand: GameStateShortSmallEntity[] = [];
	Board: GameStateShortSmallEntity[] = [];
	Secrets: GameStateShortSmallEntity[] = [];
	Deck: GameStateShortSmallEntity[] = [];
	AllEntities: GameStateShortSmallEntity[] = [];
	LettuceAbilities: GameStateShortSmallEntity[] = [];
}

export class GameStateShortSmallEntity {
	entityId: number = 0;
	cardId: string = '';
	attack: number = 0;
	health: number = 0;
	durability: number = 0;
	tags: Tag[] = [];
	enchantments: GameStateShortEnchantment[] = [];

	GetTag(tag: GameTag, defaultValue: number = -1): number {
		const match = this.tags.find((t) => t.Name === (tag as number));
		return match == null ? defaultValue : match.Value;
	}

	GetEffectiveController(): number {
		const lettuceControllerId = this.GetTag(GameTag.LETTUCE_CONTROLLER);
		if (lettuceControllerId !== -1) {
			return lettuceControllerId;
		}
		return this.GetTag(GameTag.CONTROLLER);
	}

	IsMinionLike(): boolean {
		return (
			this.GetTag(GameTag.CARDTYPE) === (CardType.MINION as number) ||
			this.GetTag(GameTag.CARDTYPE) === (CardType.LOCATION as number) ||
			this.GetTag(GameTag.CARDTYPE) === (CardType.BATTLEGROUND_SPELL as number)
		);
	}
}

export class GameStateShortEnchantment {
	entityId: number = 0;
	cardId: string = '';
	tags: Tag[] = [];
}
