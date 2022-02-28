import { Race } from '@firestone-hs/reference-data';
import { BattlegroundsState } from '../../../../models/battlegrounds/battlegrounds-state';
import { BgsResetHighlightsEvent } from '../events/bgs-reset-highlights-event';
import { BattlegroundsStoreEvent } from '../events/_battlegrounds-store-event';
import { EventParser } from './_event-parser';

export class BgsResetHighlightsParser implements EventParser {
	public applies(gameEvent: BattlegroundsStoreEvent, state: BattlegroundsState): boolean {
		return state && state.currentGame && gameEvent.type === 'BgsResetHighlightsEvent';
	}

	public async parse(currentState: BattlegroundsState, event: BgsResetHighlightsEvent): Promise<BattlegroundsState> {
		const highlightedTribes: readonly Race[] = [];
		const highlightedMinions: readonly string[] = [];
		return currentState.update({
			highlightedTribes: highlightedTribes,
			highlightedMinions: highlightedMinions,
		} as BattlegroundsState);
	}
}
