import { GameTag } from '@firestone-hs/reference-data';
import { EntityDefinition } from '../parser/entity-definition';
import { Entity } from './entity';

export class GameEntity extends Entity {
	public static create(base: GameEntity, newAttributes?: EntityDefinition): GameEntity {
		// Merge tags
		const newTags: { [tagName: string]: number } = newAttributes && newAttributes.tags ? newAttributes.tags : {};
		const tags: { [tagName: string]: number } = base.tags ? { ...base.tags, ...newTags } : newTags;
		const newEntity: GameEntity = Object.assign(new GameEntity(), base, newAttributes, { tags });
		return newEntity;
	}

	public update(definition: EntityDefinition): GameEntity {
		const newAttributes: any = {};
		if (definition.cardID) {
			newAttributes.cardID = definition.cardID;
		}
		if (definition.name) {
			newAttributes.name = definition.name;
		}
		if (definition.tags) {
			newAttributes.tags = definition.tags;
			if (newAttributes.tags.PLAYSTATE === 8) {
				newAttributes.tags.CONCEDED = 1;
			}
		}
		return GameEntity.create(this, newAttributes);
	}

	public updateTag(tag: GameTag, value: number): GameEntity {
		const newTags: { [tagName: string]: number } = { ...this.tags, [GameTag[tag]]: value };
		const base: GameEntity = this;
		return Object.assign(new GameEntity(), base, { tags: newTags });
	}

	public updateDamage(damage: number): GameEntity {
		return this;
	}

	public isBattlegrounds(): boolean {
		return this.getTag(GameTag.TECH_LEVEL_MANA_GEM) === 1;
	}
}
