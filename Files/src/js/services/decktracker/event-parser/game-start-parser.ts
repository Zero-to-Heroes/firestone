import { EventParser } from "./event-parser";
import { GameEvent } from "../../../models/game-event";
import { GameState } from "../../../models/decktracker/game-state";
import { DeckCard } from "../../../models/decktracker/deck-card";
import { DeckParserService } from "../deck-parser.service";
import { AllCardsService } from "../../all-cards.service";
import { DeckState } from "../../../models/decktracker/deck-state";

export class GameStartParser implements EventParser {

    constructor(private deckParser: DeckParserService, private allCards: AllCardsService) { }

    applies(gameEvent: GameEvent): boolean {
        return gameEvent.type === GameEvent.GAME_START;
    }    
    
    parse(currentState: GameState, gameEvent: GameEvent): GameState {
        const currentDeck = this.deckParser.currentDeck;
		console.log('[game-state] current deck', currentDeck);
		// Parse the deck to the right format
		const deckList: ReadonlyArray<DeckCard> = this.buildDeckList(currentDeck);
		return Object.assign(new GameState(), { 
			playerDeck: { 
				deckList: deckList,
				deck: deckList,
			} as DeckState
		});
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