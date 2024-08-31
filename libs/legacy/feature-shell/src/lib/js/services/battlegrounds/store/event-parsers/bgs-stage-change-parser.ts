import { BattlegroundsState } from '@firestone/battlegrounds/core';
import { BattlegroundsStoreEvent } from '../events/_battlegrounds-store-event';
import { BgsStageChangeEvent } from '../events/bgs-stage-change-event';
import { EventParser } from './_event-parser';

export class BgsStageChangeParser implements EventParser {
	public applies(gameEvent: BattlegroundsStoreEvent, state: BattlegroundsState): boolean {
		return state && state.currentGame && gameEvent.type === 'BgsStageChangeEvent';
	}

	public async parse(currentState: BattlegroundsState, event: BgsStageChangeEvent): Promise<BattlegroundsState> {
		return currentState.update({
			currentPanelId: event.panelId,
		} as BattlegroundsState);
	}
}
