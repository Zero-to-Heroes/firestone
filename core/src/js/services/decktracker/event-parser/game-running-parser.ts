import { DeckCard } from '../../../models/decktracker/deck-card';
import { DeckState } from '../../../models/decktracker/deck-state';
import { GameState } from '../../../models/decktracker/game-state';
import { GameEvent } from '../../../models/game-event';
import { DeckHandlerService } from '../deck-handler.service';
import { EventParser } from './event-parser';

export class GameRunningParser implements EventParser {
	constructor(private readonly handler: DeckHandlerService) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return state && state.opponentDeck && gameEvent.type === GameEvent.GAME_RUNNING;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		// For now, only bother to do some things if the list is empty
		const newPlayer = this.buildNewPlayer(currentState.playerDeck, gameEvent.additionalData.playerDeckCount);
		const newOpponent = this.buildNewPlayer(currentState.opponentDeck, gameEvent.additionalData.opponentDeckCount);

		return currentState.update({
			playerDeck: newPlayer,
			opponentDeck: newOpponent,
		} as GameState);
	}

	event(): string {
		return GameEvent.GAME_RUNNING;
	}

	// For now, only bother to do some things if the current decklist is empty
	private buildNewPlayer(state: DeckState, deckCount: number): DeckState {
		if (state.deckstring) {
			console.log('[game-running] deckstring in state, returning');
			return state;
		}
		if (state.deckList && state.deckList.some((card) => card.entityId > 0 || card.cardId)) {
			console.log('[game-running] decklist in state, returning', state.deckList);
			return state;
		}
		if (state.deck && state.deck.some((card) => card.entityId > 0 || card.cardId)) {
			console.log('[game-running] deck in state, returning', state.deck);
			return state;
		}
		const newDeck = this.handler.buildEmptyDeckList(deckCount);

		return state.update({
			deckList: [] as readonly DeckCard[],
			deck: newDeck,
			cardsLeftInDeck: deckCount,
		} as DeckState);
	}
}
