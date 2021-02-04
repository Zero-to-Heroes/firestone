import { GameEvent } from '../../../../../../models/game-event';
import { RealTimeStatsState } from '../../real-time-stats';
import { EventParser } from './../_event-parser';

export class RTStatsBgsFaceOffParser implements EventParser {
	applies(gameEvent: GameEvent, currentState: RealTimeStatsState): boolean {
		return gameEvent.type === GameEvent.BATTLEGROUNDS_BATTLE_RESULT;
	}

	parse(
		gameEvent: GameEvent,
		currentState: RealTimeStatsState,
	): RealTimeStatsState | PromiseLike<RealTimeStatsState> {
		const result = gameEvent.additionalData.result;
		return currentState.update({
			totalBattlesWon: currentState.totalBattlesWon + (result === 'won' ? 1 : 0),
			totalBattlesTied: currentState.totalBattlesTied + (result === 'tied' ? 1 : 0),
			totalBattlesLost: currentState.totalBattlesLost + (result === 'lost' ? 1 : 0),
		} as RealTimeStatsState);
	}

	name(): string {
		return 'RTStatsBgsFaceOffParser';
	}
}
