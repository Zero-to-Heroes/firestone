import { GameEvent } from '../../../../../models/game-event';
import { RealTimeStatsState } from '../real-time-stats';

export interface EventParser {
	applies(gameEvent: GameEvent, currentState: RealTimeStatsState): boolean;
	parse(gameEvent: GameEvent, currentState: RealTimeStatsState): RealTimeStatsState | PromiseLike<RealTimeStatsState>;
	name(): string;
}
