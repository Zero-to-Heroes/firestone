import { CardsFacadeService } from '@services/cards-facade.service';
import { GameEvent } from '../../../../../../models/game-event';
import { isBattlegrounds, normalizeHeroCardId } from '../../../../bgs-utils';
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
		const heroCardId = normalizeHeroCardId(gameEvent.cardId, this.allCards);
		const armor = gameEvent.additionalData.armor;
		const health = gameEvent.additionalData.health;

		const turn = currentState.reconnectOngoing ? currentState.currentTurn : 0;
		const hpOverTurn = currentState.hpOverTurn;
		const existingData = hpOverTurn[heroCardId] ?? [];
		const latestInfo = existingData[existingData.length - 1];
		const newData = [
			...existingData.filter((data) => data.turn !== turn),
			{
				turn: turn,
				value: turn === 0 || existingData.length === 0 ? health : latestInfo.value,
				armor: armor,
			},
		];
		hpOverTurn[heroCardId] = newData;
		return currentState.update({
			hpOverTurn: hpOverTurn,
		} as RealTimeStatsState);
	}

	name(): string {
		return 'RTStatsBgsHeroSelectedParser';
	}
}
