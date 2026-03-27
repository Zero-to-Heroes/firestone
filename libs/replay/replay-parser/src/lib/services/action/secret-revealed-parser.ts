import { BlockType, GameTag } from '@firestone-hs/reference-data';
import { Map } from 'immutable';
import { Action } from '../../models/action/action';
import { SecretRevealedAction } from '../../models/action/secret-revealed-action';
import { Entity } from '../../models/game/entity';
import { ActionHistoryItem } from '../../models/history/action-history-item';
import { HistoryItem } from '../../models/history/history-item';
import { AllCardsService } from '../all-cards.service';
import { Parser } from './parser';

export class SecretRevealedParser implements Parser {
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
		const entity = entitiesBeforeAction.get(parseInt(item.node.attributes.entity));
		if (!entity || entity.getTag(GameTag.SECRET) !== 1) {
			return;
		}
		return [
			SecretRevealedAction.create(
				{
					timestamp: item.timestamp,
					index: item.index,
					entityId: entity.id,
				},
				this.allCards,
			),
		];
	}

	public reduce(actions: readonly Action[]): readonly Action[] {
		return actions;
	}
}
