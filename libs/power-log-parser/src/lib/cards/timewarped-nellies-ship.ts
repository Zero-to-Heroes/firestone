import { GameTag, Zone } from '@firestone-hs/reference-data';
import { FullEntity } from '../models/entity';
import type { StateFacade } from '../state/state-facade';

export class TimewarpedNelliesShip {
	static EnhanceEntity(initialEntity: FullEntity, stateFacade: StateFacade): FullEntity {
		const games = stateFacade.GSReplay.Games;
		const currentGame = games[games.length - 1];

		const createdByNellie = currentGame
			.FilterGameData(FullEntity)
			.filter((d): d is FullEntity => d instanceof FullEntity)
			.filter(
				(e) =>
					e.GetTag(GameTag.CREATOR) === initialEntity.Entity &&
					e.GetZone() === (Zone.HAND as number),
			);

		if (createdByNellie.length > 0) {
			const distinctCardIds = [...new Set(createdByNellie.map((e) => e.CardId))];
			initialEntity.DynamicInfo.push(...distinctCardIds);
		} else {
			const spawnedByNellie = currentGame
				.FilterGameData(FullEntity)
				.filter((d): d is FullEntity => d instanceof FullEntity)
				.filter((e) => e.GetTag(GameTag.CREATOR) === initialEntity.Entity);

			if (spawnedByNellie.length > 0) {
				const distinctCardIds = [...new Set(spawnedByNellie.map((e) => e.CardId))];
				initialEntity.DynamicInfo.push(...distinctCardIds);
			}
		}
		return initialEntity;
	}
}
