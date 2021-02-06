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
		const currentWinStreak = result === 'won' ? currentState.currentWinStreak + 1 : 0;
		const highestWinStreak = Math.max(currentState.highestWinStreak, currentWinStreak);
		return currentState.update({
			totalBattlesWon: currentState.totalBattlesWon + (result === 'won' ? 1 : 0),
			totalBattlesTied: currentState.totalBattlesTied + (result === 'tied' ? 1 : 0),
			totalBattlesLost: currentState.totalBattlesLost + (result === 'lost' ? 1 : 0),
			currentWinStreak: currentWinStreak,
			highestWinStreak: highestWinStreak,
		} as RealTimeStatsState);
	}

	name(): string {
		return 'RTStatsBgsFaceOffParser';
	}
}
