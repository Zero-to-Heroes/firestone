import { DeckCard } from '../../../models/decktracker/deck-card';
import { DeckState } from '../../../models/decktracker/deck-state';
import { GameState } from '../../../models/decktracker/game-state';
import { GameEvent } from '../../../models/game-event';
import { AllCardsService } from '../../all-cards.service';
import { DeckParserService } from '../deck-parser.service';
import { DeckEvents } from './deck-events';
import { DeckManipulationHelper } from './deck-manipulation-helper';
import { EventParser } from './event-parser';

export class ReceiveCardInHandParser implements EventParser {
	constructor(private deckParser: DeckParserService, private allCards: AllCardsService) {}

	applies(gameEvent: GameEvent): boolean {
		return gameEvent.type === GameEvent.RECEIVE_CARD_IN_HAND;
	}

	parse(currentState: GameState, gameEvent: GameEvent): GameState {
		if (currentState.playerDeck.deckList.length === 0) {
			return currentState;
		}
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();
		const isPlayer = cardId && controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;

		// First try and see if this card doesn't come from the board
		const card = DeckManipulationHelper.findCardInZone(deck.board, null, entityId);
		const newBoard = DeckManipulationHelper.removeSingleCardFromZone(deck.board, null, entityId);

		const cardData = this.allCards.getCard(cardId);
		const cardWithDefault =
			card ||
			Object.assign(new DeckCard(), {
				cardId: cardId,
				entityId: entityId,
				cardName: cardData && cardData.name,
				manaCost: cardData && cardData.cost,
				rarity: cardData && cardData.rarity ? cardData.rarity.toLowerCase() : null,
			} as DeckCard);
		const previousHand = deck.hand;
		const newHand: readonly DeckCard[] = DeckManipulationHelper.addSingleCardToZone(previousHand, cardWithDefault);

		const newPlayerDeck = Object.assign(new DeckState(), deck, {
			hand: newHand,
			board: newBoard,
		});
		return Object.assign(new GameState(), currentState, {
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
		});
	}

	event(): string {
		return DeckEvents.RECEIVE_CARD_IN_HAND;
	}
}
