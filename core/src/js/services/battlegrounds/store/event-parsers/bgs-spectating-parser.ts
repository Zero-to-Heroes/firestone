import { BattlegroundsState } from '../../../../models/battlegrounds/battlegrounds-state';
import { BgsSpectatingEvent } from '../events/bgs-spectating-event';
import { BattlegroundsStoreEvent } from '../events/_battlegrounds-store-event';
import { EventParser } from './_event-parser';

export class BgsSpectatingParser implements EventParser {
	public applies(gameEvent: BattlegroundsStoreEvent, state: BattlegroundsState): boolean {
		return state && gameEvent.type === 'BgsSpectatingEvent';
	}

	public async parse(currentState: BattlegroundsState, event: BgsSpectatingEvent): Promise<BattlegroundsState> {
		console.debug('spectating', event, currentState.inGame && event.isSpectating, currentState);
		return currentState.update({
			spectating: event.isSpectating,
			inGame: currentState.inGame && event.isSpectating,
			// currentGame: currentState.currentGame.update({
			// 	gameEnded: !event.isSpectating,
			// } as BgsGame),
		} as BattlegroundsState);
	}
}
