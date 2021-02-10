import { GameEvent } from '../../../../../models/game-event';
import { RealTimeStatsState } from '../real-time-stats';
import { EventParser } from './_event-parser';

export class RTStatsMinionsKilledParser implements EventParser {
	applies(gameEvent: GameEvent, currentState: RealTimeStatsState): boolean {
		return gameEvent.type === GameEvent.MINION_DIED;
	}

	parse(
		gameEvent: GameEvent,
		currentState: RealTimeStatsState,
	): RealTimeStatsState | PromiseLike<RealTimeStatsState> {
		const [, deadMinionControllerId, localPlayer, entityId] = gameEvent.parse();
		const isPlayer = deadMinionControllerId === localPlayer.PlayerId;
		// For now we only count the minions killed by the player, so the minions
		// whose controller is the opponent
		if (isPlayer) {
			return currentState;
		}

		return currentState.update({
			totalEnemyMinionsKilled: currentState.totalEnemyMinionsKilled + 1,
		} as RealTimeStatsState);
	}

	name(): string {
		return 'RTStatsMinionsKilledParser';
	}
}
