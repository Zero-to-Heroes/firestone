import { RealTimeStatsState } from '@firestone/battlegrounds/core';
import { GameEvent } from '../../../../../models/game-event';

export interface EventParser {
	applies(gameEvent: GameEvent, currentState: RealTimeStatsState): boolean;
	parse(gameEvent: GameEvent, currentState: RealTimeStatsState): RealTimeStatsState | PromiseLike<RealTimeStatsState>;
	name(): string;
}
