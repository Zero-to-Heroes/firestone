import { CardsFacadeService } from '@services/cards-facade.service';
import { DeckCard } from '../../../models/decktracker/deck-card';
import { DeckState } from '../../../models/decktracker/deck-state';
import { GameState } from '../../../models/decktracker/game-state';
import { GameEvent } from '../../../models/game-event';
import { publicCardCreators } from '../../hs-utils';
import { LocalizationFacadeService } from '../../localization-facade.service';
import { DeckManipulationHelper } from './deck-manipulation-helper';
import { EventParser } from './event-parser';

export class CardChangedInHandParser implements EventParser {
	constructor(
		private readonly helper: DeckManipulationHelper,
		private readonly allCards: CardsFacadeService,
		private readonly i18n: LocalizationFacadeService,
	) {}

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

		const isCardInfoPublic = isPlayer || publicCardCreators.includes(creatorCardId);
		const cardData = cardId != null ? this.allCards.getCard(cardId) : null;
		const newCardInHand = cardInHand
			? cardInHand.update({
					cardId: isCardInfoPublic ? cardId : cardInHand.cardId,
					entityId: entityId,
					// cardName: isCardInfoPublic ? cardData.name : cardInHand.cardName,
					cardName: isCardInfoPublic
						? this.i18n.getCardName(cardData.id)
						: this.i18n.getCardName(cardInHand.cardId),
					manaCost: isCardInfoPublic && cardData ? cardData.cost : undefined,
					actualManaCost:
						isCardInfoPublic && cardData ? cardInHand.actualManaCost ?? cardData.cost : undefined,
					rarity:
						isCardInfoPublic && cardData && cardData.rarity
							? cardData.rarity.toLowerCase()
							: cardInHand.rarity,
			  } as DeckCard)
			: null;

		const newHand = newCardInHand ? this.helper.replaceCardInZone(deck.hand, newCardInHand) : deck.hand;

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
