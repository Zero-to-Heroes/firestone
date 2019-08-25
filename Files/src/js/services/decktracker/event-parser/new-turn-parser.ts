import { GameState } from '../../../models/decktracker/game-state';
import { GameEvent } from '../../../models/game-event';
import { DeckEvents } from './deck-events';
import { EventParser } from './event-parser';

export class NewTurnParser implements EventParser {
	constructor() {}

	applies(gameEvent: GameEvent): boolean {
		return gameEvent.type === GameEvent.TURN_START;
	}

	parse(currentState: GameState, gameEvent: GameEvent): GameState {
		const numericTurn = currentState.playerDeck.isFirstPlayer
			? Math.floor(gameEvent.additionalData.turnNumber / 2)
			: Math.floor((gameEvent.additionalData.turnNumber + 1) / 2);
		const currentTurn = currentState.mulliganOver ? numericTurn : 'mulligan';
		return Object.assign(new GameState(), currentState, {
			currentTurn: currentTurn,
		} as GameState);
	}

	event(): string {
		return DeckEvents.TURN_START;
	}
}
