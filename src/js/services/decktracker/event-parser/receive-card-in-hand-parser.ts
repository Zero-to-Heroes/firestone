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

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();
		const creatorCardId = gameEvent.additionalData.creatorCardId;
		// console.log('[receive-card-in-hand] handling event', cardId, entityId);
		const isPlayer = cardId && controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;

		// First try and see if this card doesn't come from the board
		const card = DeckManipulationHelper.findCardInZone(deck.board, null, entityId);
		// console.log('[receive-card-in-hand] trying to get card from zone', deck.board, entityId, card, cardId);
		const newBoard = DeckManipulationHelper.removeSingleCardFromZone(deck.board, null, entityId);
		// console.log('[receive-card-in-hand] new board', newBoard);

		const cardData = cardId ? this.allCards.getCard(cardId) : null;
		const cardWithDefault =
			card ||
			Object.assign(new DeckCard(), {
				cardId: cardId,
				entityId: entityId,
				cardName: cardData && cardData.name,
				manaCost: cardData && cardData.cost,
				rarity: cardData && cardData.rarity ? cardData.rarity.toLowerCase() : null,
				creatorCardId: creatorCardId,
			} as DeckCard);
		// console.log('[receive-card-in-hand] cardWithDefault', cardWithDefault, cardData);
		const previousHand = deck.hand;
		const newHand: readonly DeckCard[] = DeckManipulationHelper.addSingleCardToZone(previousHand, cardWithDefault);
		// console.log('[receive-card-in-hand] new hand', newHand);

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
