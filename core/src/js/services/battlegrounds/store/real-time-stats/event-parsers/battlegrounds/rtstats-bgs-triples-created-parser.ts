import { GameEvent } from '../../../../../../models/game-event';
import { RealTimeStatsState } from '../../real-time-stats';
import { EventParser } from '../_event-parser';

export class RTStatsBgsTriplesCreatedParser implements EventParser {
	applies(gameEvent: GameEvent, currentState: RealTimeStatsState): boolean {
		return gameEvent.type === GameEvent.BATTLEGROUNDS_TRIPLE;
	}

	parse(
		gameEvent: GameEvent,
		currentState: RealTimeStatsState,
	): RealTimeStatsState | PromiseLike<RealTimeStatsState> {
		const existingTriples = currentState.triplesPerHero[gameEvent.cardId] || 0;
		const newTriples = {
			...currentState.triplesPerHero,
			[gameEvent.cardId]: existingTriples + 1,
		};
		return currentState.update({
			triplesPerHero: newTriples,
		} as RealTimeStatsState);
	}

	name(): string {
		return 'RTStatsBgsTriplesCreatedParser';
	}
}
