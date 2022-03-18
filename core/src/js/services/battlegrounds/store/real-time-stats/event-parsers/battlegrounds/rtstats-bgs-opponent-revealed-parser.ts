import { GameType } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@services/cards-facade.service';
import { GameEvent } from '../../../../../../models/game-event';
import { normalizeHeroCardId } from '../../../../bgs-utils';
import { RealTimeStatsState } from '../../real-time-stats';
import { EventParser } from '../_event-parser';

export class RTStatsBgsOpponentRevealedParser implements EventParser {
	constructor(private readonly allCards: CardsFacadeService) {}

	applies(gameEvent: GameEvent, currentState: RealTimeStatsState): boolean {
		return (
			[GameType.GT_BATTLEGROUNDS, GameType.GT_BATTLEGROUNDS_FRIENDLY].includes(currentState.gameType) &&
			gameEvent.type === GameEvent.BATTLEGROUNDS_OPPONENT_REVEALED
		);
	}

	parse(
		gameEvent: GameEvent,
		currentState: RealTimeStatsState,
	): RealTimeStatsState | PromiseLike<RealTimeStatsState> {
		const heroCardId = normalizeHeroCardId(gameEvent.additionalData.cardId, this.allCards);
		// const armor = gameEvent.additionalData.armor;
		const health = gameEvent.additionalData.health;

		const turn = currentState.reconnectOngoing ? currentState.currentTurn : 0;
		const hpOverTurn = currentState.hpOverTurn;
		const existingData = hpOverTurn[heroCardId] ?? [];
		const newData = [
			...existingData.filter((data) => data.turn !== turn),
			{
				turn: turn,
				value: turn === 0 || existingData.length === 0 ? health : existingData[existingData.length - 1].value,
				armor: 0,
			},
		];
		// console.debug('bgs damage armor opponentRevealed', heroCardId, newData, hpOverTurn[heroCardId]);
		hpOverTurn[heroCardId] = newData;
		return currentState.update({
			hpOverTurn: hpOverTurn,
		} as RealTimeStatsState);
	}

	name(): string {
		return 'RTStatsBgsOpponentRevealedParser';
	}
}
