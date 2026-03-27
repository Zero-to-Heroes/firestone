import { GameTag } from '@firestone-hs/reference-data';
import { Map } from 'immutable';
import { Action } from '../../../models/action/action';
import { BaconBoardVisualStateAction } from '../../../models/action/battlegrounds/bacon-board-visual-state-action';
import { Entity } from '../../../models/game/entity';
import { HistoryItem } from '../../../models/history/history-item';
import { TagChangeHistoryItem } from '../../../models/history/tag-change-history-item';
import { AllCardsService } from '../../all-cards.service';
import { Parser } from '../parser';

export class BaconBoardVisualStateParser implements Parser {
	constructor(private readonly allCards: AllCardsService) {}

	public applies(item: HistoryItem): boolean {
		return item instanceof TagChangeHistoryItem && item.tag.tag === GameTag.BOARD_VISUAL_STATE;
	}

	public parse(
		item: TagChangeHistoryItem,
		currentTurn: number,
		entitiesBeforeAction: Map<number, Entity>,
		history: readonly HistoryItem[],
	): Action[] {
		// TODO: add checks that we are indeed in a Battlegrounds game?
		// // console.log('visual', item.tag.value, item);
		return [
			BaconBoardVisualStateAction.create(
				{
					timestamp: item.timestamp,
					newState: item.tag.value,
					index: item.index,
				} as BaconBoardVisualStateAction,
				this.allCards,
			),
		];
	}

	public reduce(actions: readonly Action[]): readonly Action[] {
		return actions;
	}
}
