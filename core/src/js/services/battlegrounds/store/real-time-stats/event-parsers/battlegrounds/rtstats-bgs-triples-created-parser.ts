import { GameType } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@services/cards-facade.service';
import { GameEvent } from '../../../../../../models/game-event';
import { normalizeHeroCardId } from '../../../../bgs-utils';
import { RealTimeStatsState } from '../../real-time-stats';
import { EventParser } from '../_event-parser';

export class RTStatsBgsTriplesCreatedParser implements EventParser {
	constructor(private readonly allCards: CardsFacadeService) {}

	applies(gameEvent: GameEvent, currentState: RealTimeStatsState): boolean {
		return (
			[GameType.GT_BATTLEGROUNDS, GameType.GT_BATTLEGROUNDS_FRIENDLY].includes(currentState.gameType) &&
			gameEvent.type === GameEvent.BATTLEGROUNDS_TRIPLE
		);
	}

	parse(
		gameEvent: GameEvent,
		currentState: RealTimeStatsState,
	): RealTimeStatsState | PromiseLike<RealTimeStatsState> {
		const normaliedId = normalizeHeroCardId(gameEvent.cardId, this.allCards);
		const existingTriples = currentState.triplesPerHero[normaliedId] || 0;
		const newTriples = {
			...currentState.triplesPerHero,
			[normaliedId]: existingTriples + 1,
		};
		return currentState.update({
			triplesPerHero: newTriples,
		} as RealTimeStatsState);
	}

	name(): string {
		return 'RTStatsBgsTriplesCreatedParser';
	}
}
