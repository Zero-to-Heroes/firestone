import { isBattlegrounds } from '@firestone-hs/reference-data';
import { RealTimeStatsState } from '../../../../models/_barrel';
import { GameEvent } from '../../../game-events/game-event';
import { EventParser } from '../_event-parser';

export class RTStatBgsEnemyHeroKilledParser implements EventParser {
	applies(gameEvent: GameEvent, currentState: RealTimeStatsState): boolean {
		return isBattlegrounds(currentState.gameType) && gameEvent.type === GameEvent.BATTLEGROUNDS_ENEMY_HERO_KILLED;
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
