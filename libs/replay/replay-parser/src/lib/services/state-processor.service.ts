import { Injectable } from '@angular/core';
import { GameTag } from '@firestone-hs/reference-data';
import { Map } from 'immutable';
import { Entity } from '../models/game/entity';
import { ChangeEntityHistoryItem } from '../models/history/change-entity-history-item';
import { FullEntityHistoryItem } from '../models/history/full-entity-history-item';
import { HistoryItem } from '../models/history/history-item';
import { ShowEntityHistoryItem } from '../models/history/show-entity-history-item';
import { TagChangeHistoryItem } from '../models/history/tag-change-history-item';

@Injectable({
	providedIn: 'root',
})
export class StateProcessorService {
	constructor() {}

	private readonly USEFUL_TAGS: readonly GameTag[] = [
		GameTag._333,
		GameTag.ARMOR,
		GameTag.ATK,
		GameTag.ATTACHED,
		GameTag.BACON_HERO_CAN_BE_DRAFTED,
		GameTag.BOARD_VISUAL_STATE,
		GameTag.CANT_BE_TARGETED_BY_HERO_POWERS,
		GameTag.CANT_BE_TARGETED_BY_SPELLS,
		GameTag.CARDTYPE,
		GameTag.CHARGE,
		GameTag.CLASS,
		GameTag.CONTROLLER,
		GameTag.COST,
		GameTag.CREATOR,
		GameTag.CURRENT_HEROPOWER_DAMAGE_BONUS,
		GameTag.CURRENT_PLAYER,
		GameTag.CURRENT_SPELLPOWER_BASE,
		GameTag.DAMAGE,
		GameTag.DEATHRATTLE,
		GameTag.DIVINE_SHIELD,
		GameTag.DURABILITY_DEPRECATED,
		GameTag.EXHAUSTED,
		GameTag.EXHAUSTED,
		GameTag.FROZEN,
		GameTag.GAME_MODE_BUTTON_SLOT, // Used to know what button is active in a specific slot
		GameTag.HEALTH,
		GameTag.HEAVILY_ARMORED,
		GameTag.HERO_ENTITY,
		GameTag.HERO_POWER_DISABLED,
		GameTag.HERO_POWER_DISABLED,
		GameTag.HERO_POWER_DOUBLE,
		GameTag.HIDDEN_CHOICE,
		GameTag.HIDE_STATS,
		GameTag.IMMUNE,
		GameTag.INSPIRE,
		GameTag.JUST_PLAYED,
		GameTag.LIFESTEAL,
		GameTag.MULLIGAN_STATE,
		GameTag.NEXT_OPPONENT_PLAYER_ID,
		GameTag.NUM_CARDS_PLAYED_THIS_TURN,
		GameTag.NUM_RESOURCES_SPENT_THIS_GAME,
		GameTag.OVERLOAD_LOCKED,
		GameTag.OVERLOAD_OWED,
		GameTag.PARENT_CARD,
		GameTag.PLAYER_ID,
		GameTag.PLAYER_LEADERBOARD_PLACE,
		GameTag.PLAYER_TECH_LEVEL,
		GameTag.PLAYSTATE,
		GameTag.POISONOUS,
		GameTag.PREMIUM,
		GameTag.PREMIUM,
		GameTag.QUEST_PROGRESS_TOTAL,
		GameTag.QUEST_PROGRESS,
		GameTag.QUEST,
		GameTag.REBORN,
		GameTag.RECEIVES_DOUBLE_SPELLDAMAGE_BONUS,
		GameTag.RESOURCES_USED,
		GameTag.RESOURCES,
		GameTag.SECRET,
		GameTag.SILENCED,
		GameTag.SPELLPOWER_DOUBLE,
		GameTag.STEALTH,
		GameTag.STEP,
		GameTag.TAG_SCRIPT_DATA_NUM_1,
		GameTag.TAG_SCRIPT_DATA_NUM_2,
		GameTag.TAUNT,
		GameTag.TECH_LEVEL_MANA_GEM,
		GameTag.TECH_LEVEL,
		GameTag.TRIGGER_VISUAL,
		GameTag.TURN,
		GameTag.WINDFURY,
		GameTag.ZONE_POSITION,
		GameTag.ZONE,
	];

	public applyHistoryUntilEnd(
		previousStateEntities: Map<number, Entity>,
		history: readonly HistoryItem[],
		previousProcessedItem: HistoryItem,
	): Map<number, Entity> {
		const startIndex = history.indexOf(previousProcessedItem);
		const futureHistory = history.slice(startIndex);
		let newStateEntities = previousStateEntities;
		// // console.log('applying history until now', startIndex, futureHistory, history);
		for (const historyItem of futureHistory) {
			newStateEntities = this.applyHistoryItem(newStateEntities, historyItem);
		}
		// // console.log('after history applied 150', newStateEntities.get(150) && newStateEntities.get(150).tags.toJS());
		return newStateEntities;
	}

	public applyHistoryItem(entities: Map<number, Entity>, item: HistoryItem): Map<number, Entity> {
		if (item instanceof TagChangeHistoryItem) {
			return this.updateWithTagChange(item, entities);
		} else if (item instanceof ShowEntityHistoryItem || item instanceof FullEntityHistoryItem) {
			return this.updateWithEntity(item, entities);
		} else if (item instanceof ChangeEntityHistoryItem) {
			return this.updateWithChangeEntity(item, entities);
		}
		return entities;
		// TODO: options, choices, chosen entities
	}

	private updateWithEntity(
		historyItem: ShowEntityHistoryItem | FullEntityHistoryItem,
		entities: Map<number, Entity>,
	): Map<number, Entity> {
		if (historyItem.entityDefintion.id === 35) {
			// console.log('applying history item', historyItem, historyItem.entityDefintion.tags?.toJS());
		}
		if (!entities.get(historyItem.entityDefintion.id)) {
			console.warn('[state-processor] could not update entity', historyItem.entityDefintion.id);
			return entities;
		}

		// if (historyItem.entityDefintion.id === 73 || historyItem.entityDefintion.id === 74) {
		// 	// console.log('enriching state', historyItem);
		// }
		const entity: Entity = entities.get(historyItem.entityDefintion.id).update(historyItem.entityDefintion);
		// if (entity.id === 150) {
		// 	// console.log(
		// 		'updating with 150',
		// 		entity,
		// 		entity.tags.toJS(),
		// 		entities
		// 			.set(entity.id, entity)
		// 			.get(150)
		// 			.tags.toJS(),
		// 	);
		// }
		return entities.set(entity.id, entity);
	}

	private updateWithChangeEntity(
		historyItem: ChangeEntityHistoryItem,
		entities: Map<number, Entity>,
	): Map<number, Entity> {
		if (!entities.get(historyItem.entityDefintion.id)) {
			console.warn('[state-processor] could not update entity', historyItem.entityDefintion.id);
			return entities;
		}
		const entity: Entity = entities.get(historyItem.entityDefintion.id).update(historyItem.entityDefintion);
		return entities.set(entity.id, entity);
	}

	private updateWithTagChange(historyItem: TagChangeHistoryItem, entities: Map<number, Entity>): Map<number, Entity> {
		// Only a limited number of tags are useful for replay reconstitution. If the tag isn't
		// one of them, we simply ignore it. Thanks to this, we will have less differences
		// between our entities, which will improve the memory footprint and performances
		if (this.USEFUL_TAGS.indexOf(historyItem.tag.tag) === -1) {
			return entities;
		}
		// No default creation - if the entity is not registered yet, it's a bug
		// It sometimes happens that the XML itself doesn't have the right entity
		// so we safeguard here
		if (!entities.get(historyItem.tag.entity)) {
			console.warn('[state-processor] could not update entity', historyItem.tag.entity);
			return entities;
		}

		const entity: Entity = entities
			.get(historyItem.tag.entity)
			.updateTag(historyItem.tag.tag, historyItem.tag.value);
		return entities.set(entity.id, entity);
	}
}
