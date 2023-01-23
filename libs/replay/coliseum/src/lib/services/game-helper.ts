import { GameTag, Zone } from '@firestone-hs/reference-data';
import { Entity, GameEntity } from '@firestone-hs/replay-parser';
import { Map } from 'immutable';

export class GameHelper {
	public static getOptions(zone: readonly Entity[], options: readonly number[]): readonly number[] {
		// console.log('getting options for', zone.map(e => e && e.id));
		return zone
			.filter((entity) => entity)
			.map((entity) => entity.id)
			.filter((id) => options && options.indexOf(id) !== -1);
	}

	public static getGameEntity(entities: Map<number, Entity> | undefined): Entity | undefined {
		return entities
			?.valueSeq()
			?.toArray()
			.find((entity) => entity instanceof GameEntity);
	}

	public static getTavernButton(
		entities: Map<number, Entity>,
		controllerId: number,
		slotPosition: number,
	): Entity | undefined {
		const gameEntity = GameHelper.getGameEntity(entities);
		if (!gameEntity || !entities?.count || !gameEntity.getTag(GameTag.TECH_LEVEL_MANA_GEM)) {
			return undefined;
		}
		return entities
			.valueSeq()
			.toArray()
			.find(
				(entity) =>
					entity.getZone() === Zone.PLAY &&
					entity.getTag(GameTag.GAME_MODE_BUTTON_SLOT) === slotPosition &&
					entity.getTag(GameTag.CONTROLLER) === controllerId,
			);
	}
}
