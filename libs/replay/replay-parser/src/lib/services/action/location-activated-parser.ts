import { BlockType, CardType, GameTag } from '@firestone-hs/reference-data';
import { Map } from 'immutable';
import { Action } from '../../models/action/action';
import { LocationActivatedAction } from '../../models/action/location-activated-action';
import { Entity } from '../../models/game/entity';
import { ActionHistoryItem } from '../../models/history/action-history-item';
import { HistoryItem } from '../../models/history/history-item';
import { AllCardsService } from '../all-cards.service';
import { Parser } from './parser';

export class LocationActivatedParser implements Parser {
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
		if (parseInt(item.node.attributes.type) !== BlockType.POWER) {
			return [];
		}

		if (item.node.isSelfClosing) {
			return [];
		}

		const entity = entitiesBeforeAction.get(parseInt(item.node.attributes.entity));
		if (!entity) {
			return [];
		}
		if (entity.getTag(GameTag.CARDTYPE) !== CardType.LOCATION) {
			return [];
		}

		return [
			LocationActivatedAction.create(
				{
					timestamp: item.timestamp,
					index: item.index,
					originId: entity.id,
					debug: item,
				},
				this.allCards,
			),
		];
	}

	public reduce(actions: readonly Action[]): readonly Action[] {
		return actions;
		// return ActionHelper.combineActions<Action>(
		// 	actions,
		// 	(previous, current) => this.shouldMergeActions(previous, current),
		// 	(previous, current) => this.mergeActions(previous, current),
		// );
	}

	private shouldMergeActions(previousAction: Action, currentAction: Action): boolean {
		if (previousAction instanceof LocationActivatedAction) {
			return true;
		}
		return false;
	}

	private mergeActions(previousAction: Action, currentAction: Action): Action {
		// Possibly because of some log artifacts, the same action is detected multiple times
		if (previousAction instanceof LocationActivatedAction && previousAction.originId === currentAction.originId) {
			return previousAction;
		}
		return previousAction;
	}
}
