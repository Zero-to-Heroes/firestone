import { Race } from '@firestone-hs/reference-data';
import { BattlegroundsState } from '../../../../models/battlegrounds/battlegrounds-state';
import { BgsToggleHighlightTribeOnBoardEvent } from '../events/bgs-toggle-highlight-tribe-on-board-event';
import { BattlegroundsStoreEvent } from '../events/_battlegrounds-store-event';
import { EventParser } from './_event-parser';

export class BgsToggleHighlightTribeOnBoardParser implements EventParser {
	public applies(gameEvent: BattlegroundsStoreEvent, state: BattlegroundsState): boolean {
		return state && state.currentGame && gameEvent.type === 'BgsToggleHighlightTribeOnBoardEvent';
	}

	public async parse(
		currentState: BattlegroundsState,
		event: BgsToggleHighlightTribeOnBoardEvent,
	): Promise<BattlegroundsState> {
		const highlightedTribes: readonly Race[] = currentState.highlightedTribes.includes(event.tribe)
			? currentState.highlightedTribes.filter((tribe) => tribe !== event.tribe)
			: [...currentState.highlightedTribes, event.tribe];
		return currentState.update({
			highlightedTribes: highlightedTribes,
		} as BattlegroundsState);
	}
}
