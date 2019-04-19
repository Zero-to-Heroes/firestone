import { EventParser } from "./event-parser";
import { GameEvent } from "../../../models/game-event";
import { GameState } from "../../../models/decktracker/game-state";
import { DeckCard } from "../../../models/decktracker/deck-card";
import { DeckParserService } from "../deck-parser.service";
import { AllCardsService } from "../../all-cards.service";
import { DeckState } from "../../../models/decktracker/deck-state";
import { DeckEvents } from "./deck-events";
import { HeroCard } from "../../../models/decktracker/hero-card";

export class GameStartParser implements EventParser {

    constructor(private deckParser: DeckParserService, private allCards: AllCardsService) { }

    applies(gameEvent: GameEvent): boolean {
        return gameEvent.type === GameEvent.GAME_START;
    }    
    
    parse(currentState: GameState, gameEvent: GameEvent): GameState {
        const currentDeck = this.deckParser.currentDeck;
		const deckList: ReadonlyArray<DeckCard> = this.buildDeckList(currentDeck);
		const hero: HeroCard = this.buildHero(currentDeck);
		return Object.assign(new GameState(), { 
			playerDeck: { 
				name: currentDeck.name,
				hero: hero,
				deckList: deckList,
				deck: deckList,
				graveyard: [],
				hand: [],
                otherZone: [],
                dynamicZones: [],
			} as DeckState
		});
    }

	event(): string {
		return DeckEvents.GAME_START;
	}

	private buildHero(currentDeck: any): HeroCard {
		if (!currentDeck || !currentDeck.deck) {
			return null;
		}
		return currentDeck.deck.heroes
				.map((hero) => this.allCards.getCardFromDbfId(hero))
				.map((heroCard) => Object.assign(new HeroCard(), { 
					cardId: heroCard.id,
					name: heroCard.name
				} as HeroCard))
				[0];
	}
	
	private buildDeckList(currentDeck: any): ReadonlyArray<DeckCard> {
		if (!currentDeck || !currentDeck.deck) {
			return [];
		}
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
			rarity: card.rarity ? card.rarity.toLowerCase() : null,
			totalQuantity: pair[1]
		} as DeckCard);
	}    
}