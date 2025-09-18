import { NumericTurnInfo } from '@firestone-hs/hs-replay-xml-parser/dist/lib/model/numeric-turn-info';
import { CardType } from '@firestone-hs/reference-data';
import { RealTimeStatsState } from '@firestone/game-state';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameEvent } from '../../../../../../models/game-event';
import { isBattlegrounds } from '../../../../bgs-utils';
import { EventParser } from '../_event-parser';

export class RTStatBgsSpellsPlayedParser implements EventParser {
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
		if (this.allCards.getCard(cardId).type?.toUpperCase() !== CardType[CardType.SPELL]) {
			return currentState;
		}

		const playedThisTurn =
			currentState.spellsPlayedOverTurn.find((info) => info.turn === currentState.currentTurn)?.value ?? 0;
		const newPlayed: readonly NumericTurnInfo[] = [
			...currentState.spellsPlayedOverTurn.filter((info) => info.turn !== currentState.currentTurn),
			{
				turn: currentState.currentTurn,
				value: playedThisTurn + 1,
			},
		];

		return currentState.update({
			spellsPlayedOverTurn: newPlayed,
		});
	}

	name(): string {
		return 'RTStatBgsSpellsPlayedParser';
	}
}
