import { GameType } from '@firestone-hs/reference-data';
import { GameEvent } from '../../../../../../models/game-event';
import { RealTimeStatsState } from '../../real-time-stats';
import { EventParser } from '../_event-parser';

export class RTStatBgsEnemyHeroKilledParser implements EventParser {
	applies(gameEvent: GameEvent, currentState: RealTimeStatsState): boolean {
		return (
			[GameType.GT_BATTLEGROUNDS, GameType.GT_BATTLEGROUNDS_FRIENDLY].includes(currentState.gameType) &&
			gameEvent.type === GameEvent.BATTLEGROUNDS_ENEMY_HERO_KILLED
		);
	}

	parse(
		gameEvent: GameEvent,
		currentState: RealTimeStatsState,
	): RealTimeStatsState | PromiseLike<RealTimeStatsState> {
		return currentState.update({
			totalEnemyHeroesKilled: currentState.totalEnemyHeroesKilled + 1,
		} as RealTimeStatsState);
	}

	name(): string {
		return 'RTStatBgsEnemyHeroKilledParser';
	}
}
