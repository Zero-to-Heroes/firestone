import { BooleanTurnInfo } from '@firestone-hs/hs-replay-xml-parser/dist/lib/model/boolean-turn-info';

import { isBattlegrounds } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { RealTimeStatsState } from '../../../../models/_barrel';
import { GameEvent } from '../../../game-events/game-event';
import { EventParser } from '../_event-parser';

export class RTStatBgsAttackFirstParser implements EventParser {
	constructor(private readonly allCards: CardsFacadeService) {}

	applies(gameEvent: GameEvent, currentState: RealTimeStatsState): boolean {
		return isBattlegrounds(currentState.gameType) && gameEvent.type === GameEvent.ATTACKING_MINION;
	}

	parse(
		gameEvent: GameEvent,
		currentState: RealTimeStatsState,
	): RealTimeStatsState | PromiseLike<RealTimeStatsState> {
		const [, , localPlayer] = gameEvent.parse();
		// Already computed the info for this turn
		if (
			currentState.wentFirstInBattleOverTurn.length > 0 &&
			currentState.wentFirstInBattleOverTurn[currentState.wentFirstInBattleOverTurn.length - 1].turn ===
				currentState.currentTurn
		) {
			return currentState;
		}

		if (this.allCards.getCard(gameEvent.additionalData.attackerCardId)?.type !== 'Minion') {
			return currentState;
		}

		const isPlayer = gameEvent.additionalData.attackerControllerId === localPlayer.PlayerId;
		const wentFirstInBattleOverTurn: readonly BooleanTurnInfo[] = [
			...currentState.wentFirstInBattleOverTurn,
			{
				turn: currentState.currentTurn,
				value: isPlayer,
			},
		];

		return currentState.update({
			wentFirstInBattleOverTurn: wentFirstInBattleOverTurn,
		} as RealTimeStatsState);
	}

	name(): string {
		return 'RTStatBgsAttackFirstParser';
	}
}
