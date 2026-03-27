import { BlockType, GameTag } from '@firestone-hs/reference-data';
import { Map } from 'immutable';
import { Action } from '../../models/action/action';
import { QuestCompletedAction } from '../../models/action/quest-completed-action';
import { Entity } from '../../models/game/entity';
import { ActionHistoryItem } from '../../models/history/action-history-item';
import { HistoryItem } from '../../models/history/history-item';
import { AllCardsService } from '../all-cards.service';
import { Parser } from './parser';

export class QuestCompletedParser implements Parser {
	constructor(private allCards: AllCardsService) {}

	public applies(item: HistoryItem): boolean {
		return item instanceof ActionHistoryItem && parseInt(item.node.attributes.type) === BlockType.TRIGGER;
	}

	public parse(
		item: ActionHistoryItem,
		currentTurn: number,
		entitiesBeforeAction: Map<number, Entity>,
		history: readonly HistoryItem[],
	): Action[] {
		const originId = parseInt(item.node.attributes.entity);
		const entity = entitiesBeforeAction.get(originId);
		if (!entity) {
			return [];
		}
		if (entity.getTag(GameTag.QUEST) === 1 && item.node.fullEntities && item.node.fullEntities.length === 1) {
			return [
				QuestCompletedAction.create(
					{
						timestamp: item.timestamp,
						index: item.index,
						originId,
					},
					this.allCards,
				),
			];
		}
		return [];
	}

	public reduce(actions: readonly Action[]): readonly Action[] {
		return actions;
	}
}
