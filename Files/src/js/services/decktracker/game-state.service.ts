import { Injectable } from '@angular/core';
import { GameEvents } from '../game-events.service';
import { GameEvent } from '../../models/game-event';
import { GameState } from '../../models/decktracker/game-state';
import { DeckParserService } from './deck-parser.service';
import { DeckCard } from '../../models/decktracker/deck-card';
import { AllCardsService } from '../all-cards.service';

@Injectable()
export class GameStateService {

	private state: GameState;

	constructor(
			private gameEvents: GameEvents, 
			private allCards: AllCardsService,
			private deckParser: DeckParserService) {
		this.registerGameEvents();
	}

	private registerGameEvents() {
		this.gameEvents.allEvents.subscribe((gameEvent: GameEvent) => {
			console.log('receiving event', gameEvent);
			switch (gameEvent.type) {
				case GameEvent.GAME_START:
					console.log('startGame event');
					this.startGame();
					break;
			}
		})
	}

	private startGame() {
		const currentDeck = this.deckParser.currentDeck;
		console.log('[game-state] current deck', currentDeck);
		// Parse the deck to the right format
		const deckList: ReadonlyArray<DeckCard> = this.buildDeckList(currentDeck);
		this.state = Object.assign(new GameState(), { 
			playerDeck: { deckList: deckList }
		});
		console.log('[game-state] current state', this.state);
	}
	
	private buildDeckList(currentDeck: any): ReadonlyArray<DeckCard> {
		return currentDeck.deck.cards
				// [dbfid, count] pair
				.map((pair) => this.buildDeckCard(pair))
				.sort((a: DeckCard, b: DeckCard) => a.manaCost - b.manaCost);
	}

	private buildDeckCard(pair): DeckCard {
		const card = this.allCards.getCardFromDbfId(pair[0]);
		return Object.assign(new DeckCard(), { 
			cardId: card.id,
			cardName: card.name,
			manaCost: card.cost,
			totalQuantity: pair[1],
		} as DeckCard);
	}
}
