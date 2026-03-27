import { GameTag, Zone } from '@firestone-hs/reference-data';
import { Map } from 'immutable';
import { Action } from '../../models/action/action';
import { TradeAction } from '../../models/action/trade-action';
import { Entity } from '../../models/game/entity';
import { HistoryItem } from '../../models/history/history-item';
import { TagChangeHistoryItem } from '../../models/history/tag-change-history-item';
import { AllCardsService } from '../all-cards.service';
import { Parser } from './parser';

export class TradeParser implements Parser {
	constructor(private allCards: AllCardsService) {}

	public applies(item: HistoryItem): boolean {
		return item instanceof TagChangeHistoryItem && item.tag.tag === GameTag.IS_USING_TRADE_OPTION;
	}

	public parse(
		item: TagChangeHistoryItem,
		currentTurn: number,
		entitiesBeforeAction: Map<number, Entity>,
		history: readonly HistoryItem[],
	): Action[] {
		const entity = entitiesBeforeAction.get(item.tag.entity);
		// Damage is reset to 0 after an entity dies, and we don't want to show this
		if (!entity || entity.getTag(GameTag.ZONE) !== Zone.HAND) {
			return [];
		}

		return [
			TradeAction.create(
				{
					timestamp: item.timestamp,
					index: item.index,
					originId: item.tag.entity,
				} as Action,
				this.allCards,
			),
		];
	}

	public reduce(actions: readonly Action[]): readonly Action[] {
		return actions;
	}
}
