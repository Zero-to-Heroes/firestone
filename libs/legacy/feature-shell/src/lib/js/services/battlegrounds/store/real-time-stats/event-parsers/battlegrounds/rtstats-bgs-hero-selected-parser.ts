import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameEvent } from '../../../../../../models/game-event';
import { isBattlegrounds } from '../../../../bgs-utils';
import { RealTimeStatsState } from '../../real-time-stats';
import { EventParser } from '../_event-parser';

export class RTStatsBgsHeroSelectedParser implements EventParser {
	constructor(private readonly allCards: CardsFacadeService) {}

	applies(gameEvent: GameEvent, currentState: RealTimeStatsState): boolean {
		return isBattlegrounds(currentState.gameType) && gameEvent.type === GameEvent.BATTLEGROUNDS_HERO_SELECTED;
	}

	parse(
		gameEvent: GameEvent,
		currentState: RealTimeStatsState,
	): RealTimeStatsState | PromiseLike<RealTimeStatsState> {
		const playerId = gameEvent.localPlayer.PlayerId;
		const armor = gameEvent.additionalData.armor;
		const health = gameEvent.additionalData.health;

		const turn = currentState.reconnectOngoing ? currentState.currentTurn : 0;
		const hpOverTurn = currentState.hpOverTurn;
		const existingData = hpOverTurn[playerId] ?? [];
		const latestInfo = existingData[existingData.length - 1];
		const newData = [
			...existingData.filter((data) => data.turn !== turn),
			{
				turn: turn,
				value: turn === 0 || existingData.length === 0 ? health : latestInfo.value,
				armor: armor,
			},
		];
		hpOverTurn[playerId] = newData;
		const playerIdMapping = currentState.playerIdToCardIdMapping;
		playerIdMapping[playerId] = gameEvent.cardId;
		return currentState.update({
			hpOverTurn: hpOverTurn,
			playerIdToCardIdMapping: playerIdMapping,
		} as RealTimeStatsState);
	}

	name(): string {
		return 'RTStatsBgsHeroSelectedParser';
	}
}
