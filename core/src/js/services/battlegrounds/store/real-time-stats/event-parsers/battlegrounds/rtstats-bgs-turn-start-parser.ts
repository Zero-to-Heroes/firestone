import { NumericTurnInfo } from '@firestone-hs/hs-replay-xml-parser/dist/lib/model/numeric-turn-info';
import { GameEvent } from '../../../../../../models/game-event';
import { RealTimeStatsState } from '../../real-time-stats';
import { EventParser } from '../_event-parser';

export class RTStatBgsTurnStartParser implements EventParser {
	applies(gameEvent: GameEvent, currentState: RealTimeStatsState): boolean {
		return gameEvent.type === GameEvent.TURN_START;
	}

	parse(
		gameEvent: GameEvent,
		currentState: RealTimeStatsState,
	): RealTimeStatsState | PromiseLike<RealTimeStatsState> {
		const newCurrentTurn = Math.ceil(gameEvent.additionalData.turnNumber / 2);
		const hpOverTurn = currentState.hpOverTurn;
		for (const hero of Object.keys(hpOverTurn)) {
			const existingStats = hpOverTurn[hero];
			// This is just for the first turn, when opponents are not revealed yet
			// We shouldn't even get to that safeguard, since opponents aren't added
			// to the history, but it's just in case the order of events get
			// somehow mixed up
			if (!existingStats?.length) {
				continue;
			}
			const newStats: readonly NumericTurnInfo[] = [
				...existingStats.filter((stat) => stat.turn !== newCurrentTurn),
				{
					turn: newCurrentTurn,
					value: existingStats[existingStats.length - 1].value,
				},
			];
			hpOverTurn[hero] = newStats;
		}

		return currentState.update({
			hpOverTurn: hpOverTurn,
		} as RealTimeStatsState);
	}

	name(): string {
		return 'RTStatBgsTurnStartParser';
	}
}
