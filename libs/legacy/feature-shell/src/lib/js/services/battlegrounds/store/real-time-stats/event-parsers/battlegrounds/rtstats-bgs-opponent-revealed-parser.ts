import { NumericTurnInfo } from '@models/battlegrounds/post-match/numeric-turn-info';
import { CardsFacadeService } from '@services/cards-facade.service';
import { GameEvent } from '../../../../../../models/game-event';
import { isBattlegrounds, normalizeHeroCardId } from '../../../../bgs-utils';
import { RealTimeStatsState } from '../../real-time-stats';
import { EventParser } from '../_event-parser';

export class RTStatsBgsOpponentRevealedParser implements EventParser {
	constructor(private readonly allCards: CardsFacadeService) {}

	applies(gameEvent: GameEvent, currentState: RealTimeStatsState): boolean {
		return isBattlegrounds(currentState.gameType) && gameEvent.type === GameEvent.BATTLEGROUNDS_OPPONENT_REVEALED;
	}

	parse(
		gameEvent: GameEvent,
		currentState: RealTimeStatsState,
	): RealTimeStatsState | PromiseLike<RealTimeStatsState> {
		const heroCardId = normalizeHeroCardId(gameEvent.additionalData.cardId, this.allCards);
		// const armor = gameEvent.additionalData.armor;
		const health = gameEvent.additionalData.health;
		const leaderboardPosition = gameEvent.additionalData.leaderboardPlace;

		const turn = currentState.reconnectOngoing ? currentState.currentTurn : 0;
		const hpOverTurn = currentState.hpOverTurn;
		const leaderboardPositionOverTurn = currentState.leaderboardPositionOverTurn;
		const existingHpData = hpOverTurn[heroCardId] ?? [];
		const existingPositionData = leaderboardPositionOverTurn[heroCardId] ?? [];
		const newHpData = [
			...existingHpData.filter((data) => data.turn !== turn),
			{
				turn: turn,
				value:
					turn === 0 || existingHpData.length === 0
						? health
						: existingHpData[existingHpData.length - 1].value,
				armor: 0,
			},
		];
		const newPositionData: readonly NumericTurnInfo[] = [
			...existingPositionData.filter((data) => data.turn !== turn),
			{
				turn: turn,
				value:
					turn === 0 || existingPositionData.length === 0
						? leaderboardPosition
						: existingPositionData[existingPositionData.length - 1].value,
			},
		];
		hpOverTurn[heroCardId] = newHpData;
		leaderboardPositionOverTurn[heroCardId] = newPositionData;
		return currentState.update({
			hpOverTurn: hpOverTurn,
			leaderboardPositionOverTurn: leaderboardPositionOverTurn,
		} as RealTimeStatsState);
	}

	name(): string {
		return 'RTStatsBgsOpponentRevealedParser';
	}
}
