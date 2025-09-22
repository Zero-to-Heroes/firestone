import { RealTimeStatsState } from '@firestone/game-state';
import { GameEvent } from '../../../../../../../../../../app/common/src/lib/services/game-events/game-event';

export interface EventParser {
	applies(gameEvent: GameEvent, currentState: RealTimeStatsState): boolean;
	parse(gameEvent: GameEvent, currentState: RealTimeStatsState): RealTimeStatsState | PromiseLike<RealTimeStatsState>;
	name(): string;
}
