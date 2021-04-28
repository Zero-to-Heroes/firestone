import { GameEvent } from '../../../../../models/game-event';
import { MinionsDiedEvent } from '../../../../../models/mainwindow/game-events/minions-died-event';
import { RealTimeStatsState } from '../real-time-stats';
import { EventParser } from './_event-parser';

export class RTStatsMinionsKilledParser implements EventParser {
	applies(gameEvent: GameEvent, currentState: RealTimeStatsState): boolean {
		return gameEvent.type === GameEvent.MINIONS_DIED;
	}

	parse(
		gameEvent: MinionsDiedEvent,
		currentState: RealTimeStatsState,
	): RealTimeStatsState | PromiseLike<RealTimeStatsState> {
		const [, , localPlayer, entityId] = gameEvent.parse();

		const deadEnemyMinions = gameEvent.additionalData.deadMinions.filter(deadMinion => {
			const isPlayer = deadMinion.ControllerId === localPlayer?.PlayerId;
			return !isPlayer;
		});

		// For now we only count the minions killed by the player, so the minions
		// whose controller is the opponent
		if (!deadEnemyMinions?.length) {
			return currentState;
		}

		return currentState.update({
			totalEnemyMinionsKilled: currentState.totalEnemyMinionsKilled + deadEnemyMinions.length,
		} as RealTimeStatsState);
	}

	name(): string {
		return 'RTStatsMinionsKilledParser';
	}
}
