import { GameTag, Mulligan } from '@firestone-hs/reference-data';
import { Map } from 'immutable';
import { Action } from '../../models/action/action';
import { StartTurnAction } from '../../models/action/start-turn-action';
import { Entity } from '../../models/game/entity';
import { ActionHistoryItem } from '../../models/history/action-history-item';
import { HistoryItem } from '../../models/history/history-item';
import { TagChangeHistoryItem } from '../../models/history/tag-change-history-item';
import { AllCardsService } from '../all-cards.service';
import { Parser } from './parser';

export class StartOfMulliganParser implements Parser {
	private numberOfMulligansDone = 0;

	constructor(private readonly allCards: AllCardsService) {}

	public applies(item: HistoryItem): boolean {
		return (
			item instanceof TagChangeHistoryItem &&
			item.tag.tag === GameTag.MULLIGAN_STATE &&
			item.tag.value === Mulligan.INPUT
		);
	}

	public parse(
		item: ActionHistoryItem,
		currentTurn: number,
		entitiesBeforeAction: Map<number, Entity>,
		history: readonly HistoryItem[],
	): Action[] {
		if (this.numberOfMulligansDone > 0) {
			return [];
		}
		this.numberOfMulligansDone++;
		// // console.log('starting mulligan action', item);
		return [
			StartTurnAction.create(
				{
					timestamp: item.timestamp,
					turn: currentTurn,
					isStartOfMulligan: true,
					index: item.index,
				},
				this.allCards,
			),
		];
	}

	public reduce(actions: readonly Action[]): readonly Action[] {
		return actions;
	}
}
