import { BlockType, GameTag } from '@firestone-hs/reference-data';
import { Map } from 'immutable';
import { Action } from '../../models/action/action';
import { AttackAction } from '../../models/action/attack-action';
import { Entity } from '../../models/game/entity';
import { ActionHistoryItem } from '../../models/history/action-history-item';
import { HistoryItem } from '../../models/history/history-item';
import { AllCardsService } from '../all-cards.service';
import { ActionHelper } from './action-helper';
import { Parser } from './parser';

export class AttackParser implements Parser {
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
		if (parseInt(item.node.attributes.type) !== BlockType.ATTACK) {
			return;
		}
		let target = parseInt(item.node.attributes.target);
		if (!target) {
			// console.warn('Could not parse target entity id', item);
			target = ActionHelper.getTag(item.node.tags, GameTag.PROPOSED_DEFENDER);
		}
		// Happens when buying items for Battlegrounds
		if (!target) {
			// console.warn('Could not parse target entity id at all', item);
			return [];
		}
		return [
			AttackAction.create(
				{
					timestamp: item.timestamp,
					index: item.index,
					originId: parseInt(item.node.attributes.entity),
					targetId: target,
				},
				this.allCards,
			),
		];
	}

	public reduce(actions: readonly Action[]): readonly Action[] {
		return actions;
	}
}
