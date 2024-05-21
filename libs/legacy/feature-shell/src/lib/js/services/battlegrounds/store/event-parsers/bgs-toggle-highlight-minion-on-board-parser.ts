import { BattlegroundsState } from '@firestone/battlegrounds/common';
import { BattlegroundsStoreEvent } from '../events/_battlegrounds-store-event';
import { BgsToggleHighlightMinionOnBoardEvent } from '../events/bgs-toggle-highlight-minion-on-board-event';
import { EventParser } from './_event-parser';

export class BgsToggleHighlightMinionOnBoardParser implements EventParser {
	public applies(gameEvent: BattlegroundsStoreEvent, state: BattlegroundsState): boolean {
		return state && state.currentGame && gameEvent.type === 'BgsToggleHighlightMinionOnBoardEvent';
	}

	public async parse(
		currentState: BattlegroundsState,
		event: BgsToggleHighlightMinionOnBoardEvent,
	): Promise<BattlegroundsState> {
		let highlightedMinions: readonly string[] = currentState.highlightedMinions;
		for (const cardId of event.cardIds) {
			highlightedMinions = highlightedMinions.includes(cardId)
				? highlightedMinions.filter((c) => c !== cardId)
				: [...highlightedMinions, cardId];
		}
		console.debug(
			'[bgs-highlight] new highlighted minions',
			highlightedMinions,
			currentState.highlightedMinions,
			event.cardIds,
		);
		return currentState.update({
			highlightedMinions: highlightedMinions,
		} as BattlegroundsState);
	}
}
