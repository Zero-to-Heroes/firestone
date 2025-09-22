import { RealTimeStatsState } from '@firestone/game-state';
import { GameEvent } from '../../../../../../../../../../app/common/src/lib/services/game-events/game-event';
import { EventParser } from './_event-parser';

export class RTStatsReconnectStartParser implements EventParser {
	applies(gameEvent: GameEvent, currentState: RealTimeStatsState): boolean {
		return gameEvent.type === GameEvent.RECONNECT_START;
	}

	parse(
		gameEvent: GameEvent,
		currentState: RealTimeStatsState,
	): RealTimeStatsState | PromiseLike<RealTimeStatsState> {
		return currentState.update({
			reconnectOngoing: true,
		} as RealTimeStatsState);
	}

	name(): string {
		return 'RTStatsReconnectStartParser';
	}
}
