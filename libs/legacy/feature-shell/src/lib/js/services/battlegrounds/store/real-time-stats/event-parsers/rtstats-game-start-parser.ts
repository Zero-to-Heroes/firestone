import { RealTimeStatsState } from '@firestone/game-state';
import { GameEvent } from '../../../../../models/game-event';
import { EventParser } from './_event-parser';

export class RTStatsGameStartParser implements EventParser {
	applies(gameEvent: GameEvent, currentState: RealTimeStatsState): boolean {
		return gameEvent.type === GameEvent.GAME_START;
	}

	parse(
		gameEvent: GameEvent,
		currentState: RealTimeStatsState,
	): RealTimeStatsState | PromiseLike<RealTimeStatsState> {
		if (currentState?.reconnectOngoing) {
			return currentState;
		}
		return new RealTimeStatsState();
	}

	name(): string {
		return 'RTStatsGameStartParser';
	}
}
