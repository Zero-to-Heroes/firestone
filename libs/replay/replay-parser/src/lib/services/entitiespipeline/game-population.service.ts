import { Injectable } from '@angular/core';
import { CardType, GameTag, Zone, isBattlegrounds } from '@firestone-hs/reference-data';
import { Map } from 'immutable';
import { Entity } from '../../models/game/entity';
import { GameEntity } from '../../models/game/game-entity';
import { PlayerEntity } from '../../models/game/player-entity';
import { FullEntityHistoryItem } from '../../models/history/full-entity-history-item';
import { GameHistoryItem } from '../../models/history/game-history-item';
import { HistoryItem } from '../../models/history/history-item';
import { PlayerHistoryItem } from '../../models/history/player-history-item';
import { ShowEntityHistoryItem } from '../../models/history/show-entity-history-item';
import { TagChangeHistoryItem } from '../../models/history/tag-change-history-item';
import { Game } from '../../models/models';
import { EntityDefinition } from '../../models/parser/entity-definition';
import { AllCardsService } from '../all-cards.service';

@Injectable({
	providedIn: 'root',
})
export class GamePopulationService {
	constructor(private allCards: AllCardsService) {}

	public initNewEntities(
		game: Game,
		history: readonly HistoryItem[],
		entityCardIdMapping: Map<number, string>,
	): Map<number, Entity> {
		// Map of entityId - entity definition
		// TODO: should we remove here all the SETASIDE / REMOVEDFROMGAME entities?
		const entities: Map<number, Entity> = game
			.getLatestParsedState()
			.filter((entity: Entity) => ![Zone.REMOVEDFROMGAME].includes(entity.getTag(GameTag.ZONE)));
		// console.debug('entities reduced from', game.getLatestParsedState().size, 'to', entities.size);
		const entitiesAfterInit: Map<number, Entity> = this.initializeEntities(history, entities);
		const entitiesAfterFillingCardIds: Map<number, Entity> = this.addMissingCardIds(
			entitiesAfterInit,
			entityCardIdMapping,
		);
		const entitiesAfterMissingInfo: Map<number, Entity> = this.completeMissingInformation(
			history,
			entitiesAfterFillingCardIds,
		);
		const entitiesAfterBasicData: Map<number, Entity> = this.addBasicData(entitiesAfterMissingInfo);
		return entitiesAfterBasicData;
		// return Game.createGame(game, {
		// 	entities: entitiesAfterBasicData,
		// } as Game);
		// return entitiesAfterBasicData;
	}

	private initializeEntities(history: readonly HistoryItem[], entities: Map<number, Entity>): Map<number, Entity> {
		let result = entities;
		for (const item of history) {
			if (item instanceof PlayerHistoryItem) {
				result = this.initializePlayer(item, result);
			} else if (item instanceof GameHistoryItem) {
				result = this.initializeGame(item, result);
			} else if (item instanceof FullEntityHistoryItem) {
				result = this.initializeFullEntity(item, result);
			} else if (item instanceof ShowEntityHistoryItem) {
				result = this.initializeShowEntity(item, result);
			}
		}
		return result;
	}

	private addMissingCardIds(
		entitiesAfterInit: Map<number, Entity>,
		entityCardIdMapping: Map<number, string>,
	): Map<number, Entity> {
		return entitiesAfterInit
			.map((entity, entityId) => {
				if (!entity.cardID) {
					return entity.update({
						cardID: entityCardIdMapping.get(entityId),
					} as EntityDefinition);
				}
				return entity;
			})
			.toMap();
	}

	private initializePlayer(historyItem: PlayerHistoryItem, entities: Map<number, Entity>): Map<number, Entity> {
		// Remove the battle tag if present
		const playerName =
			historyItem.entityDefintion.name.indexOf('#') !== -1
				? historyItem.entityDefintion.name.split('#')[0]
				: historyItem.entityDefintion.name;
		const entity: PlayerEntity = PlayerEntity.create({
			id: historyItem.entityDefintion.id,
			playerId: historyItem.entityDefintion.playerID,
			accountHi: historyItem.accountHi,
			accountLo: historyItem.accountLo,
			name: playerName,
			isMainPlayer: historyItem.isMainPlayer,
		} as PlayerEntity).update(historyItem.entityDefintion);
		return entities.set(entity.id, entity);
	}

	private initializeGame(historyItem: GameHistoryItem, entities: Map<number, Entity>): Map<number, Entity> {
		const base: GameEntity = Object.assign(new GameEntity(), {
			id: historyItem.entityDefintion.id,
			buildNumber: historyItem.buildNumber,
			formatType: historyItem.formatType,
			gameType: historyItem.gameType,
			scenarioID: historyItem.scenarioID,
		});
		let entity: GameEntity = GameEntity.create(base).update(historyItem.entityDefintion);
		// Battlegrounds doesn't have the right board state set at start
		if (isBattlegrounds(historyItem.gameType)) {
			// // console.log('initializing game entity with visual state', entity.tags.toJS(), entity);
			entity = entity.updateTag(GameTag.BOARD_VISUAL_STATE, 1);
			// // console.log('updated', entity.tags.toJS(), entity);
		}
		return entities.set(entity.id, entity);
	}

	private initializeFullEntity(
		historyItem: FullEntityHistoryItem,
		entities: Map<number, Entity>,
	): Map<number, Entity> {
		const newAttributes: any = {};
		// We use the ShowEntity only to update the cardID at this stage
		// and for a few other tags.
		// Since we don't stop at mulligan stage, this means that otherwise
		// a lot of other entities will be created
		if (historyItem.entityDefintion.cardID) {
			newAttributes.cardID = historyItem.entityDefintion.cardID;
		}
		// if (historyItem.entityDefintion.id === 73 || historyItem.entityDefintion.id === 74) {
		// 	// // console.log('enriching', historyItem);
		// }
		const entity: Entity = entities
			.get(historyItem.entityDefintion.id, Entity.create({ id: historyItem.entityDefintion.id } as Entity))
			.update(newAttributes as EntityDefinition);
		return entities.set(entity.id, entity);
	}

	private initializeShowEntity(
		historyItem: ShowEntityHistoryItem,
		entities: Map<number, Entity>,
	): Map<number, Entity> {
		const newAttributes: any = {};
		// Same here
		if (historyItem.entityDefintion.cardID) {
			newAttributes.cardID = historyItem.entityDefintion.cardID;
		}
		// if (historyItem.entityDefintion.id === 73 || historyItem.entityDefintion.id === 74) {
		// 	// // console.log('enriching', historyItem);
		// }
		const entity: Entity = entities
			.get(historyItem.entityDefintion.id, Entity.create({ id: historyItem.entityDefintion.id } as Entity))
			.update(newAttributes as EntityDefinition);
		return entities.set(entity.id, entity);
	}

	private completeMissingInformation(
		history: readonly HistoryItem[],
		entities: Map<number, Entity>,
	): Map<number, Entity> {
		let result = entities;
		for (const item of history) {
			if (item instanceof TagChangeHistoryItem) {
				result = this.addTagInformation(item, result);
			}
			if (item instanceof ShowEntityHistoryItem) {
				result = this.addEntityInformation(item, result);
			}
		}
		return result;
	}

	private addTagInformation(item: TagChangeHistoryItem, entities: Map<number, Entity>): Map<number, Entity> {
		// if (item.tag.entity === 73 || item.tag.entity === 74) {
		// 	// // console.log('enriching', item);
		// }
		if (item.tag.tag === GameTag.SECRET && item.tag.value === 1) {
			const entity: Entity = entities.get(item.tag.entity)?.update({ tags: { [GameTag[item.tag.tag]]: 1 } });
			return !!entity ? entities.set(entity.id, entity) : entities;
		} else if (item.tag.tag === GameTag.QUEST && item.tag.value === 1) {
			const entity: Entity = entities.get(item.tag.entity)?.update({ tags: { [GameTag[item.tag.tag]]: 1 } });
			return !!entity ? entities.set(entity.id, entity) : entities;
		} else if (item.tag.tag === GameTag.PARENT_CARD) {
			const entity: Entity = entities
				.get(item.tag.entity)
				?.update({ tags: { [GameTag[item.tag.tag]]: item.tag.value } });
			return !!entity ? entities.set(entity.id, entity) : entities;
		}
		return entities;
	}

	private addEntityInformation(item: ShowEntityHistoryItem, entities: Map<number, Entity>): Map<number, Entity> {
		// if (item.entityDefintion.id === 73 || item.entityDefintion.id === 74) {
		// 	// // console.log('enriching', item);
		// }
		let result = entities;
		if (item.entityDefintion.tags[GameTag[GameTag.SECRET]] === 1) {
			const entity: Entity = entities.get(item.entityDefintion.id).update({
				tags: { [GameTag[GameTag.SECRET]]: 1 },
			});
			result = entities.set(entity.id, entity);
		}
		const newTags: { [tagName: string]: number } = {
			[GameTag[GameTag.CREATOR]]: item.entityDefintion.tags[GameTag[GameTag.CREATOR]],
			[GameTag[GameTag.TAG_SCRIPT_DATA_NUM_1]]: item.entityDefintion.tags[GameTag[GameTag.TAG_SCRIPT_DATA_NUM_1]],
			[GameTag[GameTag.TAG_SCRIPT_DATA_NUM_2]]: item.entityDefintion.tags[GameTag[GameTag.TAG_SCRIPT_DATA_NUM_2]],
		};
		const finalEntity: Entity = result.get(item.entityDefintion.id).update({ tags: newTags });
		return result.set(finalEntity.id, finalEntity);
	}

	private addBasicData(entities: Map<number, Entity>): Map<number, Entity> {
		return entities
			.map((value: Entity) => {
				if (!value.cardID) {
					return value;
				}
				const card = this.allCards.getCard(value.cardID);
				let newTags: { [tagName: string]: number } = {};
				if (card) {
					if (card.type === 'Spell' && !value.getTag(GameTag.CARDTYPE)) {
						newTags = { ...value.tags, [GameTag[GameTag.CARDTYPE]]: CardType.SPELL };
					}
					if (card.type === 'Enchantment' && !value.getTag(GameTag.CARDTYPE)) {
						newTags = { ...value.tags, [GameTag[GameTag.CARDTYPE]]: CardType.ENCHANTMENT };
					}
				}
				return value.update({ tags: newTags });
			})
			.toMap();
	}
}
