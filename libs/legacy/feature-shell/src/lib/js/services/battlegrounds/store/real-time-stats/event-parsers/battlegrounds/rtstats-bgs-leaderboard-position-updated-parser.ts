import { CardsFacadeService } from '@services/cards-facade.service';
import { GameEvent } from '../../../../../../models/game-event';
import { isBattlegrounds, normalizeHeroCardId } from '../../../../bgs-utils';
import { RealTimeStatsState } from '../../real-time-stats';
import { EventParser } from '../_event-parser';

export class RTStatsBgsLeaderboardPositionUpdatedParser implements EventParser {
	constructor(private readonly allCards: CardsFacadeService) {}

	applies(gameEvent: GameEvent, currentState: RealTimeStatsState): boolean {
		return isBattlegrounds(currentState.gameType) && gameEvent.type === GameEvent.BATTLEGROUNDS_LEADERBOARD_PLACE;
	}

	parse(
		gameEvent: GameEvent,
		currentState: RealTimeStatsState,
	): RealTimeStatsState | PromiseLike<RealTimeStatsState> {
		const heroCardId = normalizeHeroCardId(gameEvent.additionalData.cardId, this.allCards);
		const newPlace = gameEvent.additionalData.leaderboardPlace;

		const turn = currentState.reconnectOngoing ? currentState.currentTurn : 0;
		const leaderboardPositionOverTurn = currentState.leaderboardPositionOverTurn;
		const existingData = leaderboardPositionOverTurn[heroCardId] ?? [];
		const newData = [
			...existingData.filter((data) => data.turn !== turn),
			{
				turn: turn,
				value: turn === 0 || existingData.length === 0 ? newPlace : existingData[existingData.length - 1].value,
			},
		];
		leaderboardPositionOverTurn[heroCardId] = newData;
		return currentState.update({
			leaderboardPositionOverTurn: leaderboardPositionOverTurn,
		} as RealTimeStatsState);
	}

	name(): string {
		return 'RTStatsBgsLeaderboardPositionUpdatedParser';
	}
}
