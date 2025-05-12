import { RealTimeStatsState } from '@firestone/game-state';
import { GameEvent } from '../../../../../models/game-event';

export interface EventParser {
	applies(gameEvent: GameEvent, currentState: RealTimeStatsState): boolean;
	parse(gameEvent: GameEvent, currentState: RealTimeStatsState): RealTimeStatsState | PromiseLike<RealTimeStatsState>;
	name(): string;
}
