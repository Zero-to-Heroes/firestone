import { DeckCard } from '../../../models/decktracker/deck-card';
import { DeckState } from '../../../models/decktracker/deck-state';
import { GameState } from '../../../models/decktracker/game-state';
import { GameEvent } from '../../../models/game-event';
import { DeckEvents } from './deck-events';
import { DeckManipulationHelper } from './deck-manipulation-helper';
import { EventParser } from './event-parser';

export class CardCreatorChangedParser implements EventParser {
	constructor(private readonly helper: DeckManipulationHelper) {}

	applies(gameEvent: GameEvent): boolean {
		return gameEvent.type === GameEvent.CARD_CREATOR_CHANGED;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();
		// console.debug('card creator changed', cardId, entityId);
		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;

		const cardInHand = this.helper.findCardInZone(deck.hand, null, entityId);
		// console.debug('cardInHand', cardInHand);
		const cardInDeck = this.helper.findCardInZone(deck.deck, null, entityId);
		// console.debug('cardInDeck', cardInDeck);

		const newCardInHand = cardInHand
			? cardInHand.update({
					creatorCardId: gameEvent.additionalData.creatorCardId,
			  } as DeckCard)
			: null;
		// console.debug('newCardInHand', newCardInHand);
		const newCardInDeck = cardInDeck
			? cardInDeck.update({
					creatorCardId: gameEvent.additionalData.creatorCardId,
			  } as DeckCard)
			: null;
		// console.debug('newCardInDeck', newCardInDeck);

		const newHand = newCardInHand ? this.helper.replaceCardInZone(deck.hand, newCardInHand) : deck.hand;
		// console.debug('newHand', newHand);
		const newDeck = newCardInDeck ? this.helper.replaceCardInZone(deck.deck, newCardInDeck) : deck.deck;
		// console.debug('newDeck', newDeck);

		const newPlayerDeck = Object.assign(new DeckState(), deck, {
			hand: newHand,
			deck: newDeck,
		});
		return Object.assign(new GameState(), currentState, {
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
		});
	}

	event(): string {
		return DeckEvents.CARD_CREATOR_CHANGED;
	}
}
