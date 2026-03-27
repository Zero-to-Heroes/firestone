import { GameTag, Zone } from '@firestone-hs/reference-data';
import { Map } from 'immutable';
import { Action } from '../../models/action/action';
import { CardDiscardAction } from '../../models/action/card-discard-action';
import { Entity } from '../../models/game/entity';
import { HistoryItem } from '../../models/history/history-item';
import { TagChangeHistoryItem } from '../../models/history/tag-change-history-item';
import { AllCardsService } from '../all-cards.service';
import { ActionHelper } from './action-helper';
import { Parser } from './parser';

export class CardDiscardParser implements Parser {
	constructor(private allCards: AllCardsService) {}

	public applies(item: HistoryItem): boolean {
		return (
			item instanceof TagChangeHistoryItem && item.tag.tag === GameTag.ZONE && item.tag.value === Zone.SETASIDE
		);
	}

	public parse(
		item: TagChangeHistoryItem,
		currentTurn: number,
		entitiesBeforeAction: Map<number, Entity>,
		history: readonly HistoryItem[],
	): Action[] {
		if (currentTurn === 0) {
			return;
		}

		const entity = entitiesBeforeAction.get(item.tag.entity);
		if (!entity) {
			return [];
		}

		const previousZone = entity.getTag(GameTag.ZONE);
		if (previousZone === Zone.HAND) {
			const controller = entitiesBeforeAction.get(item.tag.entity).getTag(GameTag.CONTROLLER);
			if (!controller) {
				console.warn('[card-discard-parser] empty controller', item, entitiesBeforeAction.get(item.tag.entity));
				return null;
			}
			return [
				CardDiscardAction.create(
					{
						timestamp: item.timestamp,
						index: item.index,
						controller,
						data: [item.tag.entity],
					},
					this.allCards,
				),
			];
		}

		return [];
	}

	public reduce(actions: readonly Action[]): readonly Action[] {
		return ActionHelper.combineActions<CardDiscardAction>(
			actions,
			(previous, current) => this.shouldMergeActions(previous, current),
			(previous, current) => this.mergeActions(previous, current),
		);
	}

	private shouldMergeActions(previous: Action, current: Action): boolean {
		if (!(previous instanceof CardDiscardAction && current instanceof CardDiscardAction)) {
			return false;
		}
		if (previous.controller === undefined || current.controller === undefined) {
			console.warn('[card-discard-parser] Empty controller for draw action', previous, current);
			return false;
		}
		return previous.controller === current.controller;
	}

	private mergeActions(previousAction: CardDiscardAction, currentAction: CardDiscardAction): CardDiscardAction {
		return CardDiscardAction.create(
			{
				timestamp: previousAction.timestamp,
				index: currentAction.index,
				entities: currentAction.entities,
				controller: currentAction.controller,
				data: [...(previousAction.data ?? []), ...(currentAction.data ?? [])].filter(
					(id, index, self) => self.indexOf(id) === index,
				),
			},
			this.allCards,
		);
	}
}
