import { DeckCard } from '../../../models/decktracker/deck-card';
import { DeckState } from '../../../models/decktracker/deck-state';
import { GameState } from '../../../models/decktracker/game-state';
import { GameEvent } from '../../../models/game-event';
import { DeckEvents } from './deck-events';
import { DeckManipulationHelper } from './deck-manipulation-helper';
import { EventParser } from './event-parser';

export class CardCreatorChangedParser implements EventParser {
	constructor() {}

	applies(gameEvent: GameEvent): boolean {
		return gameEvent.type === GameEvent.CARD_CREATOR_CHANGED;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();
		// console.debug('card creator changed', cardId, gameEvent);
		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;

		const cardInHand = DeckManipulationHelper.findCardInZone(deck.hand, cardId, entityId);
		const cardInDeck = DeckManipulationHelper.findCardInZone(deck.deck, cardId, entityId);

		const newCardInHand = cardInHand
			? Object.assign(new DeckCard(), cardInHand, {
					creatorCardId: gameEvent.additionalData.creatorCardId,
			  } as DeckCard)
			: null;
		const newCardInDeck = cardInDeck
			? Object.assign(new DeckCard(), cardInHand, {
					creatorCardId: gameEvent.additionalData.creatorCardId,
			  } as DeckCard)
			: null;

		const newHand = newCardInHand ? DeckManipulationHelper.replaceCardInZone(deck.hand, newCardInHand) : deck.hand;
		const newDeck = newCardInDeck ? DeckManipulationHelper.replaceCardInZone(deck.deck, newCardInDeck) : deck.deck;

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
