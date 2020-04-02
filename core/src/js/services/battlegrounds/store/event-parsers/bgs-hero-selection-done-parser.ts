import { BattlegroundsState } from '../../../../models/battlegrounds/battlegrounds-state';
import { BgsHeroSelectionDoneEvent } from '../events/bgs-hero-selection-done-event';
import { BattlegroundsStoreEvent } from '../events/_battlegrounds-store-event';
import { EventParser } from './_event-parser';

export class BgsHeroSelectionDoneParser implements EventParser {
	public applies(gameEvent: BattlegroundsStoreEvent, state: BattlegroundsState): boolean {
		return state && state.currentGame && gameEvent.type === 'BgsHeroSelectionDoneEvent';
	}

	public async parse(
		currentState: BattlegroundsState,
		event: BgsHeroSelectionDoneEvent,
	): Promise<BattlegroundsState> {
		return currentState.update({
			currentStageId: 'in-game',
			currentPanelId: 'bgs-next-opponent-overview',
		} as BattlegroundsState);
	}
}
