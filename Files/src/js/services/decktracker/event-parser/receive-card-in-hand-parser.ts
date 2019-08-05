import { EventParser } from './event-parser';
import { GameEvent } from '../../../models/game-event';
import { GameState } from '../../../models/decktracker/game-state';
import { DeckCard } from '../../../models/decktracker/deck-card';
import { DeckParserService } from '../deck-parser.service';
import { AllCardsService } from '../../all-cards.service';
import { DeckState } from '../../../models/decktracker/deck-state';
import { DeckEvents } from './deck-events';
import { DeckManipulationHelper } from './deck-manipulation-helper';

export class ReceiveCardInHandParser implements EventParser {
	constructor(private deckParser: DeckParserService, private allCards: AllCardsService) {}

	applies(gameEvent: GameEvent): boolean {
		if (gameEvent.type !== GameEvent.RECEIVE_CARD_IN_HAND) {
			return false;
		}
		const cardId: string = gameEvent.cardId;
		const controllerId: number = gameEvent.controllerId;
		const localPlayer = gameEvent.localPlayer;
		return cardId && controllerId === localPlayer.PlayerId;
	}

	parse(currentState: GameState, gameEvent: GameEvent): GameState {
		if (currentState.playerDeck.deckList.length === 0) {
			return currentState;
		}
		const cardId: string = gameEvent.cardId;
		const entityId: number = gameEvent.entityId;
		const cardData = this.allCards.getCard(cardId);
		const card = Object.assign(new DeckCard(), {
			cardId: cardId,
			entityId: entityId,
			cardName: cardData.name,
			manaCost: cardData.cost,
			rarity: cardData.rarity ? cardData.rarity.toLowerCase() : null,
		} as DeckCard);
		const previousHand = currentState.playerDeck.hand;
		const newHand: readonly DeckCard[] = DeckManipulationHelper.addSingleCardToZone(previousHand, card);
		const newPlayerDeck = Object.assign(new DeckState(), currentState.playerDeck, {
			hand: newHand,
		});
		return Object.assign(new GameState(), currentState, {
			playerDeck: newPlayerDeck,
		});
	}

	event(): string {
		return DeckEvents.RECEIVE_CARD_IN_HAND;
	}
}
