import { BattlegroundsState } from '../../../../models/battlegrounds/battlegrounds-state';
import { BgsToggleHighlightMinionOnBoardEvent } from '../events/bgs-toggle-highlight-minion-on-board-event';
import { BattlegroundsStoreEvent } from '../events/_battlegrounds-store-event';
import { EventParser } from './_event-parser';

export class BgsToggleHighlightMinionOnBoardParser implements EventParser {
	public applies(gameEvent: BattlegroundsStoreEvent, state: BattlegroundsState): boolean {
		return state && state.currentGame && gameEvent.type === 'BgsToggleHighlightMinionOnBoardEvent';
	}

	public async parse(
		currentState: BattlegroundsState,
		event: BgsToggleHighlightMinionOnBoardEvent,
	): Promise<BattlegroundsState> {
		const highlightedMinions: readonly string[] = currentState.highlightedMinions.includes(event.cardId)
			? currentState.highlightedMinions.filter((cardId) => cardId !== event.cardId)
			: [...currentState.highlightedMinions, event.cardId];
		return currentState.update({
			highlightedMinions: highlightedMinions,
		} as BattlegroundsState);
	}
}
