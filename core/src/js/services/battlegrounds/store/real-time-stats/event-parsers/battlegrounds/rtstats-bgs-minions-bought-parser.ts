import { GameType } from '@firestone-hs/reference-data';
import { GameEvent } from '../../../../../../models/game-event';
import { NumericTurnInfoWithCardIds, RealTimeStatsState } from '../../real-time-stats';
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

		const boughtThisTurn = currentState.minionsBoughtOverTurn.find(
			(info) => info.turn === currentState.currentTurn,
		);
		const newBought: readonly NumericTurnInfoWithCardIds[] = [
			...currentState.minionsBoughtOverTurn.filter((info) => info.turn !== currentState.currentTurn),
			{
				turn: currentState.currentTurn,
				value: (boughtThisTurn?.value ?? 0) + 1,
				cardIds: (boughtThisTurn?.cardIds ?? []).concat(gameEvent.cardId),
			} as NumericTurnInfoWithCardIds,
		];

		return currentState.update({
			minionsBoughtOverTurn: newBought,
		} as RealTimeStatsState);
	}

	name(): string {
		return 'RTStatBgsMinionsBoughtParser';
	}
}
