import { DeckState, GameState } from '@firestone/game-state';
import { GameEvent } from '../../../models/game-event';
import { EventParser } from './event-parser';

export class GameResetParser implements EventParser {
	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		console.log('[game-reset-parser] parsing game reset', currentState);
		const playerDeck = this.resetState(currentState.playerDeck);
		const opponentDeck = this.resetState(currentState.opponentDeck);
		console.log('[game-reset-parser] reset state', playerDeck, opponentDeck);
		return currentState.update({
			playerDeck: playerDeck,
			opponentDeck: opponentDeck,
		});
	}

	private resetState(state: DeckState): DeckState {
		return state.update({
			// deck: [], // We lose too much info by doing so
			hand: [],
			otherZone: [],
			board: [],
			secrets: [],
			weapon: null,
		});
	}

	event(): string {
		return GameEvent.GAME_RESET;
	}
}
