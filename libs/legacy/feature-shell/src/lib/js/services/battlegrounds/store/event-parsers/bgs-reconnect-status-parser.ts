import { BattlegroundsState } from '../../../../models/battlegrounds/battlegrounds-state';
import { BattlegroundsStoreEvent } from '../events/_battlegrounds-store-event';
import { BgsReconnectStatusEvent } from '../events/bgs-reconnect-status-event';
import { EventParser } from './_event-parser';

export class BgsReconnectStatusParser implements EventParser {
	public applies(gameEvent: BattlegroundsStoreEvent, state: BattlegroundsState): boolean {
		return state && gameEvent.type === 'BgsReconnectStatusEvent';
	}

	public async parse(currentState: BattlegroundsState, event: BgsReconnectStatusEvent): Promise<BattlegroundsState> {
		if (event.isReconnectOngoing) {
			console.log('[bgs-reconnect-status-parser] flagging reconnect ongoing');
		}
		return currentState.update({
			reconnectOngoing: event.isReconnectOngoing,
		} as BattlegroundsState);
	}
}
