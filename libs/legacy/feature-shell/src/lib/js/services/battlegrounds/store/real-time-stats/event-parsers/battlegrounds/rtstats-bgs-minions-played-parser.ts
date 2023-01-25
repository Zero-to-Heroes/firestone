import { NumericTurnInfo } from '@firestone-hs/hs-replay-xml-parser/dist/lib/model/numeric-turn-info';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameEvent } from '../../../../../../models/game-event';
import { isBattlegrounds } from '../../../../bgs-utils';
import { RealTimeStatsState } from '../../real-time-stats';
import { EventParser } from '../_event-parser';

export class RTStatBgsMinionsPlayedParser implements EventParser {
	constructor(private readonly allCards: CardsFacadeService) {}

	applies(gameEvent: GameEvent, currentState: RealTimeStatsState): boolean {
		return isBattlegrounds(currentState.gameType) && gameEvent.type === GameEvent.CARD_PLAYED;
	}

	parse(
		gameEvent: GameEvent,
		currentState: RealTimeStatsState,
	): RealTimeStatsState | PromiseLike<RealTimeStatsState> {
		const [cardId, controllerId, localPlayer] = gameEvent.parse();

		const isPlayer = controllerId === localPlayer.PlayerId;
		if (!isPlayer) {
			return currentState;
		}
		if (this.allCards.getCard(cardId).type?.toUpperCase() !== 'MINION') {
			return currentState;
		}

		const playedThisTurn =
			currentState.minionsPlayedOverTurn.find((info) => info.turn === currentState.currentTurn)?.value ?? 0;
		const newPlayed: readonly NumericTurnInfo[] = [
			...currentState.minionsPlayedOverTurn.filter((info) => info.turn !== currentState.currentTurn),
			{
				turn: currentState.currentTurn,
				value: playedThisTurn + 1,
			},
		];

		return currentState.update({
			minionsPlayedOverTurn: newPlayed,
		} as RealTimeStatsState);
	}

	name(): string {
		return 'RTStatBgsMinionsPlayedParser';
	}
}
