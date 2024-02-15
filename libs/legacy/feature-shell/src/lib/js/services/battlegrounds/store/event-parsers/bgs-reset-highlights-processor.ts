import { GameTag, Race } from '@firestone-hs/reference-data';
import { BattlegroundsState } from '@firestone/battlegrounds/common';
import { BattlegroundsStoreEvent } from '../events/_battlegrounds-store-event';
import { BgsResetHighlightsEvent } from '../events/bgs-reset-highlights-event';
import { EventParser } from './_event-parser';

export class BgsResetHighlightsParser implements EventParser {
	public applies(gameEvent: BattlegroundsStoreEvent, state: BattlegroundsState): boolean {
		return state && state.currentGame && gameEvent.type === 'BgsResetHighlightsEvent';
	}

	public async parse(currentState: BattlegroundsState, event: BgsResetHighlightsEvent): Promise<BattlegroundsState> {
		const highlightedTribes: readonly Race[] = [];
		const highlightedMinions: readonly string[] = [];
		const highlightedMechanics: readonly GameTag[] = [];
		return currentState.update({
			highlightedTribes: highlightedTribes,
			highlightedMinions: highlightedMinions,
			highlightedMechanics: highlightedMechanics,
		} as BattlegroundsState);
	}
}
