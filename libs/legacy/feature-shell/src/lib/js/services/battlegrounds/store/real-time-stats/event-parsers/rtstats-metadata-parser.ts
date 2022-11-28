import { GameEvent } from '../../../../../models/game-event';
import { RealTimeStatsState } from '../real-time-stats';
import { EventParser } from './_event-parser';

export class RTStatsMetadataParser implements EventParser {
	applies(gameEvent: GameEvent, currentState: RealTimeStatsState): boolean {
		return gameEvent.type === GameEvent.MATCH_METADATA;
	}

	parse(
		gameEvent: GameEvent,
		currentState: RealTimeStatsState,
	): RealTimeStatsState | PromiseLike<RealTimeStatsState> {
		return currentState.update({
			gameType: gameEvent.additionalData.metaData.GameType,
		} as RealTimeStatsState);
	}

	name(): string {
		return 'RTStatsMetadataParser';
	}
}
