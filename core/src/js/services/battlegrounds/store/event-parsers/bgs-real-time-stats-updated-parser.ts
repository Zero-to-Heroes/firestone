import { BattlegroundsState } from '../../../../models/battlegrounds/battlegrounds-state';
import { BgsGame } from '../../../../models/battlegrounds/bgs-game';
import { BgsRealTimeStatsUpdatedEvent } from '../events/bgs-real-time-stats-updated-event';
import { BattlegroundsStoreEvent } from '../events/_battlegrounds-store-event';
import { EventParser } from './_event-parser';

export class BgsRealTimeStatsUpdatedParser implements EventParser {
	public applies(gameEvent: BattlegroundsStoreEvent, state: BattlegroundsState): boolean {
		return state && state.currentGame && gameEvent.type === 'BgsRealTimeStatsUpdatedEvent';
	}

	public async parse(
		currentState: BattlegroundsState,
		event: BgsRealTimeStatsUpdatedEvent,
	): Promise<BattlegroundsState> {
		const newGame = currentState.currentGame.update({
			liveStats: event.realTimeStatsState,
		} as BgsGame);
		return currentState.update({
			currentGame: newGame,
		} as BattlegroundsState);
	}
}
