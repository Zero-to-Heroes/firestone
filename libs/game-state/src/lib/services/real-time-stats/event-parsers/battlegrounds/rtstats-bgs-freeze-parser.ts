import { NumericTurnInfo } from '@firestone-hs/hs-replay-xml-parser/dist/lib/model/numeric-turn-info';

import { isBattlegrounds } from '@firestone-hs/reference-data';
import { RealTimeStatsState } from '../../../../models/_barrel';
import { GameEvent } from '../../../game-events/game-event';
import { EventParser } from '../_event-parser';

export class RTStatsBgsFreezeParser implements EventParser {
	applies(gameEvent: GameEvent, currentState: RealTimeStatsState): boolean {
		return isBattlegrounds(currentState.gameType) && gameEvent.type === GameEvent.BATTLEGROUNDS_FREEZE;
	}

	parse(
		gameEvent: GameEvent,
		currentState: RealTimeStatsState,
	): RealTimeStatsState | PromiseLike<RealTimeStatsState> {
		const freezeThisTurn =
			currentState.freezesOverTurn.find((info) => info.turn === currentState.currentTurn)?.value ?? 0;
		const newFreeze: readonly NumericTurnInfo[] = [
			...currentState.freezesOverTurn.filter((info) => info.turn !== currentState.currentTurn),
			{
				turn: currentState.currentTurn,
				value: freezeThisTurn + 1,
			},
		];
		return currentState.update({
			freezesOverTurn: newFreeze,
		} as RealTimeStatsState);
	}

	name(): string {
		return 'RTStatsBgsFreezeParser';
	}
}
