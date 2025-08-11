import { isBattlegrounds } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { RealTimeStatsState } from '../../../../models/_barrel';
import { GameEvent } from '../../../game-events/game-event';
import { EventParser } from '../_event-parser';

export class RTStatsBgsTriplesCreatedParser implements EventParser {
	constructor(private readonly allCards: CardsFacadeService) {}

	applies(gameEvent: GameEvent, currentState: RealTimeStatsState): boolean {
		return isBattlegrounds(currentState.gameType) && gameEvent.type === GameEvent.BATTLEGROUNDS_TRIPLE;
	}

	parse(
		gameEvent: GameEvent,
		currentState: RealTimeStatsState,
	): RealTimeStatsState | PromiseLike<RealTimeStatsState> {
		// const normaliedId = normalizeHeroCardId(gameEvent.cardId, this.allCards);
		const playerId = gameEvent.additionalData.playerId;
		const existingTriples = currentState.triplesPerHero[playerId] || 0;
		const newTriples = {
			...currentState.triplesPerHero,
			[playerId]: existingTriples + 1,
		};
		return currentState.update({
			triplesPerHero: newTriples,
		} as RealTimeStatsState);
	}

	name(): string {
		return 'RTStatsBgsTriplesCreatedParser';
	}
}
