import { CardsFacadeService } from '@services/cards-facade.service';
import { DeckCard } from '../../../models/decktracker/deck-card';
import { DeckState } from '../../../models/decktracker/deck-state';
import { GameState } from '../../../models/decktracker/game-state';
import { GameEvent } from '../../../models/game-event';
import { DeckManipulationHelper } from './deck-manipulation-helper';
import { EventParser } from './event-parser';

export class CardChangedInDeckParser implements EventParser {
	constructor(private readonly helper: DeckManipulationHelper, private readonly allCards: CardsFacadeService) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return state && gameEvent.type === GameEvent.CARD_CHANGED_IN_DECK;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();

		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;

		// console.log('changing card in deck');
		// const card = this.helper.findCardInZone(deck.deck, cardId, entityId, true);
		const previousDeck = deck.deck;
		const [newDeck, theCard] = this.helper.removeSingleCardFromZone(
			previousDeck,
			cardId,
			entityId,
			deck.deckList.length === 0,
			true,
		);
		// When card is changed in deck (eg Galakrond), a new card is created
		const cardData = cardId != null ? this.allCards.getCard(cardId) : null;
		// Ignite for instance receives a CARD_CHANGED_IN_DECK event, and we want to
		// keep all the other attributes.
		// I'm not sure yet if there are instances where we want to remove the
		// previous attributes
		const newCard = theCard.update({
			cardId: cardId,
			entityId: entityId,
			cardName: cardData.name,
			manaCost: cardData ? cardData.cost : undefined,
			rarity: cardData && cardData.rarity ? cardData.rarity.toLowerCase() : undefined,
			creatorCardId: gameEvent.additionalData?.creatorCardId,
		} as DeckCard);
		const deckWithNewCard: readonly DeckCard[] = this.helper.addSingleCardToZone(newDeck, newCard);

		const newPlayerDeck = Object.assign(new DeckState(), deck, {
			deck: deckWithNewCard,
		} as DeckState);
		return Object.assign(new GameState(), currentState, {
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
		});
	}

	event(): string {
		return GameEvent.CARD_CHANGED_IN_DECK;
	}
}
