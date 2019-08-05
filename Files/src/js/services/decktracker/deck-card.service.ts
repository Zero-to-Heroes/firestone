import { Injectable } from '@angular/core';
import { DeckState } from '../../models/decktracker/deck-state';
import { DeckCard } from '../../models/decktracker/deck-card';
import { GameState } from '../../models/decktracker/game-state';
import { AllCardsService } from '../all-cards.service';

@Injectable()
export class DeckCardService {
	constructor(private cards: AllCardsService) {}

	// Doesn't handle dynamic zones, so should be called before dynamic zones are built
	public fillMissingCardInfo(gameState: GameState): GameState {
		return Object.assign(new GameState(), gameState, {
			playerDeck: this.fillDeck(gameState.playerDeck),
			opponentDeck: this.fillDeck(gameState.opponentDeck),
		} as GameState);
	}

	private fillDeck(deckState: DeckState): DeckState {
		return Object.assign(new DeckState(), deckState, {
			board: this.fillZone(deckState.board),
			deck: this.fillZone(deckState.deck),
			hand: this.fillZone(deckState.hand),
			otherZone: this.fillZone(deckState.otherZone),
		} as DeckState);
	}

	private fillZone(zone: readonly DeckCard[]): readonly DeckCard[] {
		return zone ? zone.map(card => this.tryFillCard(card)) : zone;
	}

	private tryFillCard(card: DeckCard): DeckCard {
		return card.cardName || !card.cardId ? card : this.doFillCard(card);
	}

	private doFillCard(card: DeckCard): DeckCard {
		const dbCard = this.cards.getCard(card.cardId);
		return Object.assign(new DeckCard(), card, {
			cardName: dbCard ? dbCard.name : card.cardName,
		} as DeckCard);
	}
}
