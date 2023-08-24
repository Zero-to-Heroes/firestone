import { DeckState } from '../../../models/decktracker/deck-state';
import { GameState } from '../../../models/decktracker/game-state';
import { GameEvent } from '../../../models/game-event';
import { EventParser } from './event-parser';

export class GameStartParser implements EventParser {
	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !state || !state.reconnectOngoing;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		return Object.assign(new GameState(), {
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
	}

	event(): string {
		return GameEvent.GAME_START;
	}
}
