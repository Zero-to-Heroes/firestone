import { BlockType, CardType, GameTag } from '@firestone-hs/reference-data';
import { Map } from 'immutable';
import { Action } from '../../models/action/action';
import { ActionButtonUsedAction } from '../../models/action/action-button-used-action';
import { Entity } from '../../models/game/entity';
import { ActionHistoryItem } from '../../models/history/action-history-item';
import { HistoryItem } from '../../models/history/history-item';
import { AllCardsService } from '../all-cards.service';
import { Parser } from './parser';

export class ActionButtonUsedParser implements Parser {
	constructor(private allCards: AllCardsService) {}

	public applies(item: HistoryItem): boolean {
		return item instanceof ActionHistoryItem;
	}

	public parse(
		item: ActionHistoryItem,
		currentTurn: number,
		entitiesBeforeAction: Map<number, Entity>,
		history: readonly HistoryItem[],
	): Action[] {
		if (parseInt(item.node.attributes.type) !== BlockType.PLAY) {
			return;
		}

		const entity = entitiesBeforeAction.get(parseInt(item.node.attributes.entity));
		if (!entity) {
			return [];
		}
		if (entity.getTag(GameTag.CARDTYPE) === CardType.HERO_POWER || entity.getTag(GameTag.BACON_ACTION_CARD) === 1) {
			return [
				ActionButtonUsedAction.create(
					{
						timestamp: item.timestamp,
						index: item.index,
						entityId: entity.id,
					},
					this.allCards,
				),
			];
		}
	}

	public reduce(actions: readonly Action[]): readonly Action[] {
		return actions;
	}
}
