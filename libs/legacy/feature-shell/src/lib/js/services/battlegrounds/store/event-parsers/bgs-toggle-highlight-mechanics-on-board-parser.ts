import { GameTag } from '@firestone-hs/reference-data';
import { BattlegroundsState } from '../../../../models/battlegrounds/battlegrounds-state';
import { BgsToggleHighlightMechanicsOnBoardEvent } from '../events/bgs-toggle-highlight-mechanics-on-board-event';
import { BattlegroundsStoreEvent } from '../events/_battlegrounds-store-event';
import { EventParser } from './_event-parser';

export class BgsToggleHighlightMechanicsOnBoardParser implements EventParser {
	public applies(gameEvent: BattlegroundsStoreEvent, state: BattlegroundsState): boolean {
		return state && state.currentGame && gameEvent.type === 'BgsToggleHighlightMechanicsOnBoardEvent';
	}

	public async parse(
		currentState: BattlegroundsState,
		event: BgsToggleHighlightMechanicsOnBoardEvent,
	): Promise<BattlegroundsState> {
		const highlightedMechanics: readonly GameTag[] = currentState.highlightedMechanics.includes(event.mechanics)
			? currentState.highlightedMechanics.filter((tribe) => tribe !== event.mechanics)
			: [...currentState.highlightedMechanics, event.mechanics];
		return currentState.update({
			highlightedMechanics: highlightedMechanics,
		} as BattlegroundsState);
	}
}
