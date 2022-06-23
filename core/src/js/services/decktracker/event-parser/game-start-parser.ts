import { DeckState } from '../../../models/decktracker/deck-state';
import { GameState } from '../../../models/decktracker/game-state';
import { GameEvent } from '../../../models/game-event';
import { EventParser } from './event-parser';

export class GameStartParser implements EventParser {
	applies(gameEvent: GameEvent): boolean {
		return gameEvent.type === GameEvent.GAME_START;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		console.debug(
			'[debug] gameStart',
			currentState,
			gameEvent.additionalData.timestamp,
			new Date(gameEvent.additionalData.timestamp),
		);
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
