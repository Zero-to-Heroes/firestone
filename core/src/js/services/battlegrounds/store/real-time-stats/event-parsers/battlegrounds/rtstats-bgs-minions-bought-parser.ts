import { NumericTurnInfo } from '@firestone-hs/hs-replay-xml-parser/dist/lib/model/numeric-turn-info';
import { GameType } from '@firestone-hs/reference-data';
import { GameEvent } from '../../../../../../models/game-event';
import { RealTimeStatsState } from '../../real-time-stats';
import { EventParser } from '../_event-parser';

export class RTStatBgsMinionsBoughtParser implements EventParser {
	applies(gameEvent: GameEvent, currentState: RealTimeStatsState): boolean {
		return (
			[GameType.GT_BATTLEGROUNDS, GameType.GT_BATTLEGROUNDS_FRIENDLY].includes(currentState.gameType) &&
			gameEvent.type === GameEvent.BATTLEGROUNDS_MINION_BOUGHT
		);
	}

	parse(
		gameEvent: GameEvent,
		currentState: RealTimeStatsState,
	): RealTimeStatsState | PromiseLike<RealTimeStatsState> {
		const [, controllerId, localPlayer] = gameEvent.parse();

		const isPlayer = controllerId === localPlayer.PlayerId;
		if (!isPlayer) {
			return currentState;
		}

		const boughtThisTurn =
			currentState.minionsBoughtOverTurn.find((info) => info.turn === currentState.currentTurn)?.value ?? 0;
		const newBought: readonly NumericTurnInfo[] = [
			...currentState.minionsBoughtOverTurn.filter((info) => info.turn !== currentState.currentTurn),
			{
				turn: currentState.currentTurn,
				value: boughtThisTurn + 1,
			},
		];

		return currentState.update({
			minionsBoughtOverTurn: newBought,
		} as RealTimeStatsState);
	}

	name(): string {
		return 'RTStatBgsMinionsBoughtParser';
	}
}
