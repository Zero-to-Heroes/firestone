import { AllCardsService } from '@firestone-hs/replay-parser';
import { DeckCard } from '../../../models/decktracker/deck-card';
import { DeckState } from '../../../models/decktracker/deck-state';
import { GameState } from '../../../models/decktracker/game-state';
import { GameEvent } from '../../../models/game-event';
import { publicCardCreators } from '../../hs-utils';
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
		const creatorCardId = gameEvent.additionalData.creatorCardId;

		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;
		const cardInHand = this.helper.findCardInZone(deck.hand, null, entityId);
		// console.debug('found card to change in hand', cardInHand, gameEvent, currentState);
		const isCardInfoPublic = isPlayer || publicCardCreators.includes(creatorCardId);
		const cardData = cardId != null ? this.allCards.getCard(cardId) : null;
		const newCardInHand = cardInHand
			? cardInHand.update({
					cardId: isCardInfoPublic ? cardId : cardInHand.cardId,
					entityId: entityId,
					cardName: isCardInfoPublic ? cardData.name : cardInHand.cardName,
					manaCost: isCardInfoPublic && cardData ? cardData.cost : undefined,
					actualManaCost:
						isCardInfoPublic && cardData ? cardInHand.actualManaCost ?? cardData.cost : undefined,
					rarity:
						isCardInfoPublic && cardData && cardData.rarity
							? cardData.rarity.toLowerCase()
							: cardInHand.rarity,
			  } as DeckCard)
			: null;
		// console.debug('newCardInHand', newCardInHand);

		const newHand = newCardInHand ? this.helper.replaceCardInZone(deck.hand, newCardInHand) : deck.hand;
		// console.debug('newHand', newHand);

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
