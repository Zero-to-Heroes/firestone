import { DeckState } from '../../../models/deck-state';
import { GameState } from '../../../models/game-state';
import { GameStateEvent } from '../../game-state-events/game-state-event';
import { ReviewIdService } from '../../review-id.service';
import { GameEvent } from '../game-event';
import { GameEventsEmitterService } from '../game-events-emitter.service';
import { EventParser } from './_event-parser';

export class GameStartParser implements EventParser {
	constructor(private readonly reviewIdService: ReviewIdService) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !state || !state.reconnectOngoing;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const initialState = Object.assign(new GameState(), {
			gameStarted: true,
			matchStartTimestamp: gameEvent.additionalData.timestamp,
			playerDeck: DeckState.create({
				isFirstPlayer: false,
			} as DeckState),
			opponentDeck: DeckState.create({
				isFirstPlayer: false,
				isOpponent: true,
			} as DeckState),
			spectating: gameEvent.additionalData.spectating,
			reconnectOngoing: currentState?.reconnectOngoing,
		} as GameState);

		return initialState;
	}

	async sideEffects(gameEvent: GameEvent | GameStateEvent, eventsEmtter: GameEventsEmitterService) {
		const reviewId = this.reviewIdService.reviewId$$.value;
		console.log('[game-start-parser] reviewId', reviewId);
		eventsEmtter.allEvents.next({
			type: GameEvent.REVIEW_ID,
			additionalData: { reviewId },
		} as GameEvent);
	}

	event(): string {
		return GameEvent.GAME_START;
	}
}
