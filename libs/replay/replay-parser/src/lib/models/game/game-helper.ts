import { GameTag, Zone } from '@firestone-hs/reference-data';
import { Map } from 'immutable';
import { Entity } from './entity';
import { GameEntity } from './game-entity';
import { PlayerEntity } from './player-entity';

// Avoid "Lambda not supported" error
// @dynamic
export class GameHepler {
	private constructor() {}

	public static getPlayerHand(entities: Map<number, Entity>, playerId: number): readonly Entity[] {
		return entities
			.filter((entity: Entity) => entity.getTag(GameTag.CONTROLLER) === playerId)
			.filter((entity: Entity) => entity.getTag(GameTag.ZONE) === Zone.HAND)
			.sortBy((entity: Entity) => entity.getTag(GameTag.ZONE_POSITION))
			.valueSeq()
			.toArray();
	}

	public static isPlayerEntity(entityId: number, entities: Map<number, Entity>) {
		return entities.get(entityId) instanceof PlayerEntity;
	}

	public static getGameEntity(entities: Map<number, Entity>): Entity {
		return entities
			? entities
					.valueSeq()
					.toArray()
					.find(entity => entity instanceof GameEntity)
			: null;
	}
}
