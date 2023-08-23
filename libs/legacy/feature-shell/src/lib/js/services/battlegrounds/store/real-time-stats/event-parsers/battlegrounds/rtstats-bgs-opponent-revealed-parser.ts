import { isBattlegrounds } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { NumericTurnInfo } from '@models/battlegrounds/post-match/numeric-turn-info';
import { GameEvent } from '../../../../../../models/game-event';
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
		const playerId = gameEvent.additionalData.playerId;
		// const heroCardId = normalizeHeroCardId(gameEvent.additionalData.cardId, this.allCards);
		// const armor = gameEvent.additionalData.armor;
		const health = gameEvent.additionalData.health;
		const armor = gameEvent.additionalData.armor;
		const leaderboardPosition = gameEvent.additionalData.leaderboardPlace;

		const turn = currentState.reconnectOngoing ? currentState.currentTurn : 0;
		const hpOverTurn = currentState.hpOverTurn;
		const leaderboardPositionOverTurn = currentState.leaderboardPositionOverTurn;
		const existingHpData = hpOverTurn[playerId] ?? [];
		const existingPositionData = leaderboardPositionOverTurn[playerId] ?? [];
		const newHpData = [
			...existingHpData.filter((data) => data.turn !== turn),
			{
				turn: turn,
				value:
					turn === 0 || existingHpData.length === 0
						? health
						: existingHpData[existingHpData.length - 1].value,
				armor: armor,
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
		hpOverTurn[playerId] = newHpData;
		leaderboardPositionOverTurn[playerId] = newPositionData;
		const playerIdMapping = currentState.playerIdToCardIdMapping;
		playerIdMapping[playerId] = gameEvent.additionalData.cardId;
		return currentState.update({
			hpOverTurn: hpOverTurn,
			leaderboardPositionOverTurn: leaderboardPositionOverTurn,
			playerIdToCardIdMapping: playerIdMapping,
		} as RealTimeStatsState);
	}

	name(): string {
		return 'RTStatsBgsOpponentRevealedParser';
	}
}
