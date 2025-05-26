import { RealTimeStatsState } from '@firestone/game-state';
import { GameEvent } from '../../../../../models/game-event';
import { EventParser } from './_event-parser';

export class RTStatsReconnectOverParser implements EventParser {
	applies(gameEvent: GameEvent, currentState: RealTimeStatsState): boolean {
		return gameEvent.type === GameEvent.RECONNECT_OVER;
	}

	parse(
		gameEvent: GameEvent,
		currentState: RealTimeStatsState,
	): RealTimeStatsState | PromiseLike<RealTimeStatsState> {
		return currentState.update({
			reconnectOngoing: false,
		} as RealTimeStatsState);
	}

	name(): string {
		return 'RTStatsReconnectOverParser';
	}
}
