import { GameEvent } from '../../../../../models/game-event';
import { RealTimeStatsState } from '../real-time-stats';
import { EventParser } from './_event-parser';

export class RTStatTurnStartParser implements EventParser {
	applies(gameEvent: GameEvent, currentState: RealTimeStatsState): boolean {
		return gameEvent.type === GameEvent.TURN_START;
	}

	parse(
		gameEvent: GameEvent,
		currentState: RealTimeStatsState,
	): RealTimeStatsState | PromiseLike<RealTimeStatsState> {
		const newCurrentTurn = Math.ceil(gameEvent.additionalData.turnNumber / 2);
		return currentState.update({
			currentTurn: newCurrentTurn,
		} as RealTimeStatsState);
	}

	name(): string {
		return 'RTStatTurnStartParser';
	}
}
