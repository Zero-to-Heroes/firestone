import { GameTag } from '@firestone-hs/reference-data';
import { EntityDefinition } from '../parser/entity-definition';
import { Entity } from './entity';

export class PlayerEntity extends Entity {
	readonly playerId: number;
	readonly name: string;
	readonly accountHi: string;
	readonly accountLo: string;
	readonly isMainPlayer: boolean;

	public static create(base: PlayerEntity, newAttributes?: EntityDefinition): PlayerEntity {
		// Merge tags
		const newTags: { [tagName: string]: number } = newAttributes && newAttributes.tags ? newAttributes.tags : {};
		const tags: { [tagName: string]: number } = base.tags ? { ...base.tags, ...newTags } : newTags;
		const newEntity: PlayerEntity = Object.assign(new PlayerEntity(), base, newAttributes, { tags });
		return newEntity;
	}

	public update(definition: EntityDefinition): PlayerEntity {
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
		return PlayerEntity.create(this, newAttributes);
	}

	public updateDamage(damage: number): PlayerEntity {
		const base: PlayerEntity = this;
		return Object.assign(new PlayerEntity(), base, { damageForThisAction: damage });
	}

	public updateTag(tag: GameTag, value: number): PlayerEntity {
		const newTags: { [tagName: string]: number } = { ...this.tags, [GameTag[tag]]: value };
		const base: PlayerEntity = this;
		return Object.assign(new PlayerEntity(), base, { tags: newTags });
	}
}
