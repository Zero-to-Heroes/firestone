import { BgsInGameWindowNavigationService } from '@firestone/battlegrounds/common';
import { DeckState, GameState } from '@firestone/game-state';
import { GameStateEvent } from '../../../models/decktracker/game-state-event';
import { GameEvent } from '../../../models/game-event';
import { GameEventsEmitterService } from '../../game-events-emitter.service';
import { ReviewIdService } from '../../review-id.service';
import { EventParser } from './event-parser';

export class GameStartParser implements EventParser {
	constructor(
		private readonly reviewIdService: ReviewIdService,
		private readonly nav: BgsInGameWindowNavigationService,
	) {}

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
		eventsEmtter.allEvents.next({
			type: GameEvent.REVIEW_ID,
			additionalData: { reviewId },
		} as GameEvent);
		this.nav.forcedStatus$$.next(null);
	}

	event(): string {
		return GameEvent.GAME_START;
	}
}
