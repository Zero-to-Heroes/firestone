import { AllCardsService } from '@firestone-hs/replay-parser';
import { DeckCard } from '../../../models/decktracker/deck-card';
import { DeckState } from '../../../models/decktracker/deck-state';
import { GameState } from '../../../models/decktracker/game-state';
import { GameEvent } from '../../../models/game-event';
import { DeckEvents } from './deck-events';
import { DeckManipulationHelper } from './deck-manipulation-helper';
import { EventParser } from './event-parser';

export class CardPlayedFromHandParser implements EventParser {
	constructor(private readonly helper: DeckManipulationHelper, private readonly allCards: AllCardsService) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return state && gameEvent.type === GameEvent.CARD_PLAYED;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();

		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;
		const card = this.helper.findCardInZone(deck.hand, cardId, entityId);
		// console.log('[card-played-from-hand] card in zone', card, deck.hand, cardId, entityId);

		const [newHand, removedCard] = this.helper.removeSingleCardFromZone(deck.hand, cardId, entityId);
		// console.log('removed card from hand', removedCard, currentState, gameEvent);
		// We can't make a connection between the card in hand and the card that started in the deck
		// when we are facing an opponent with a known decklist (like is the case with the AI for instance)
		// There are some cases where we know that a card in hand is a specific card coming from the deck:
		// if has been bounced back from the board for instance (then it has a card id).
		// If the card has a creatorCardId, we know that it's not from the original deck, so we do nothing
		let newDeck = deck.deck;
		if (!isPlayer && currentState.opponentDeck.deckList && !removedCard.creatorCardId && !removedCard.cardId) {
			const result = this.helper.removeSingleCardFromZone(deck.deck, cardId, entityId);
			const removedFromDeck = result[1];
			// if (removedFromDeck && removedFromDeck.cardId) {
			newDeck = result[0];
			// }
		}

		// Only minions end up on the board
		const refCard = this.allCards.getCard(cardId);
		const isOnBoard = refCard && refCard.type === 'Minion';
		const newBoard: readonly DeckCard[] = isOnBoard
			? this.helper.addSingleCardToZone(deck.board, card)
			: deck.board;
		const newOtherZone: readonly DeckCard[] = isOnBoard
			? deck.otherZone
			: this.helper.addSingleCardToZone(deck.otherZone, card);
		const newPlayerDeck = Object.assign(new DeckState(), deck, {
			hand: newHand,
			board: newBoard,
			deck: newDeck,
			otherZone: newOtherZone,
		});
		return Object.assign(new GameState(), currentState, {
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
		});
	}

	event(): string {
		return DeckEvents.CARD_PLAYED_FROM_HAND;
	}
}
