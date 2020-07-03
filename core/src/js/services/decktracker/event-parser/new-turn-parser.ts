import { DeckState } from '../../../models/decktracker/deck-state';
import { GameState } from '../../../models/decktracker/game-state';
import { GameEvent } from '../../../models/game-event';
import { EventParser } from './event-parser';

export class NewTurnParser implements EventParser {
	applies(gameEvent: GameEvent, state: GameState): boolean {
		return state && gameEvent.type === GameEvent.TURN_START;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const numericTurn = currentState.playerDeck.isFirstPlayer
			? Math.floor(gameEvent.additionalData.turnNumber / 2)
			: Math.floor((gameEvent.additionalData.turnNumber + 1) / 2);
		// const numericTurn = Math.floor((gameEvent.additionalData.turnNumber + 1) / 2);
		const currentTurn = currentState.mulliganOver ? numericTurn : 'mulligan';
		const playerDeck = currentState.playerDeck.update({
			isActivePlayer: currentState.playerDeck.isFirstPlayer
				? gameEvent.additionalData.turnNumber % 2 === 1
				: gameEvent.additionalData.turnNumber % 2 === 0,
		} as DeckState);
		const opponentDeck = currentState.opponentDeck.update({
			isActivePlayer: currentState.opponentDeck.isFirstPlayer
				? gameEvent.additionalData.turnNumber % 2 === 1
				: gameEvent.additionalData.turnNumber % 2 === 0,
		} as DeckState);
		// console.log('[debug] updated active player', gameEvent.additionalData.turnNumber, playerDeck, opponentDeck);
		return Object.assign(new GameState(), currentState, {
			currentTurn: currentTurn,
			playerDeck: playerDeck,
			opponentDeck: opponentDeck,
		} as GameState);
	}

	event(): string {
		return GameEvent.TURN_START;
	}
}
