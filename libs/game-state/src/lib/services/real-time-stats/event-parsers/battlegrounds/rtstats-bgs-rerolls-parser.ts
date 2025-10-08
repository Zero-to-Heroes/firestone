import { NumericTurnInfo } from '@firestone-hs/hs-replay-xml-parser/dist/lib/model/numeric-turn-info';
import { isBattlegrounds } from '@firestone-hs/reference-data';
import { RealTimeStatsState } from '../../../../models/_barrel';
import { GameEvent } from '../../../game-events/game-event';
import { EventParser } from '../_event-parser';

export class RTStatsBgsRerollsParser implements EventParser {
	applies(gameEvent: GameEvent, currentState: RealTimeStatsState): boolean {
		return isBattlegrounds(currentState.gameType) && gameEvent.type === GameEvent.BATTLEGROUNDS_REROLL;
	}

	parse(
		gameEvent: GameEvent,
		currentState: RealTimeStatsState,
	): RealTimeStatsState | PromiseLike<RealTimeStatsState> {
		const rerollsThisTurn =
			currentState.rerollsOverTurn.find((info) => info.turn === currentState.currentTurn)?.value ?? 0;
		const newRerolls: readonly NumericTurnInfo[] = [
			...currentState.rerollsOverTurn.filter((info) => info.turn !== currentState.currentTurn),
			{
				turn: currentState.currentTurn,
				value: rerollsThisTurn + 1,
			},
		];
		return currentState.update({
			rerollsOverTurn: newRerolls,
		} as RealTimeStatsState);
	}

	name(): string {
		return 'RTStatsBgsRerollsParser';
	}
}
