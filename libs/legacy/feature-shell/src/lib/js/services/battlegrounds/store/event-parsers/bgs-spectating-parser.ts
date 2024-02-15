import { BattlegroundsState } from '@firestone/battlegrounds/common';
import { BattlegroundsStoreEvent } from '../events/_battlegrounds-store-event';
import { BgsSpectatingEvent } from '../events/bgs-spectating-event';
import { EventParser } from './_event-parser';

export class BgsSpectatingParser implements EventParser {
	public applies(gameEvent: BattlegroundsStoreEvent, state: BattlegroundsState): boolean {
		return state && gameEvent.type === 'BgsSpectatingEvent';
	}

	public async parse(currentState: BattlegroundsState, event: BgsSpectatingEvent): Promise<BattlegroundsState> {
		return currentState.update({
			spectating: event.isSpectating,
			inGame: currentState.inGame && event.isSpectating,
		} as BattlegroundsState);
	}
}
