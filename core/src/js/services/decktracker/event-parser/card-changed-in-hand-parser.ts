import { AllCardsService } from '@firestone-hs/replay-parser';
import { DeckCard } from '../../../models/decktracker/deck-card';
import { DeckState } from '../../../models/decktracker/deck-state';
import { GameState } from '../../../models/decktracker/game-state';
import { GameEvent } from '../../../models/game-event';
import { DeckManipulationHelper } from './deck-manipulation-helper';
import { EventParser } from './event-parser';

export class CardChangedInHandParser implements EventParser {
	constructor(private readonly helper: DeckManipulationHelper, private readonly allCards: AllCardsService) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return state && gameEvent.type === GameEvent.CARD_CHANGED_IN_HAND;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		// cardId is the new card id here
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();
		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;
		const cardInHand = this.helper.findCardInZone(deck.hand, null, entityId);
		// console.log('found card to change in hand', cardInHand);

		const cardData = cardId != null ? this.allCards.getCard(cardId) : null;
		const newCardInHand = cardInHand
			? cardInHand.update({
					cardId: isPlayer ? cardId : cardInHand.cardId,
					entityId: entityId,
					cardName: isPlayer ? cardData.name : cardInHand.cardName,
					manaCost: isPlayer && cardData ? cardData.cost : undefined,
					actualManaCost: isPlayer && cardData ? cardInHand.actualManaCost ?? cardData.cost : undefined,
					rarity: isPlayer && cardData && cardData.rarity ? cardData.rarity.toLowerCase() : cardInHand.rarity,
			  } as DeckCard)
			: null;
		// console.log('newCardInHand', newCardInHand);

		const newHand = newCardInHand ? this.helper.replaceCardInZone(deck.hand, newCardInHand) : deck.hand;
		// console.log('newHand', newHand);

		const newPlayerDeck = Object.assign(new DeckState(), deck, {
			hand: newHand,
		});
		return Object.assign(new GameState(), currentState, {
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
		});
	}

	event(): string {
		return GameEvent.CARD_CHANGED_IN_HAND;
	}
}
