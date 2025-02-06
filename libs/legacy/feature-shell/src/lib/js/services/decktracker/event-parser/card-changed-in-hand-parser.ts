import { DeckCard, DeckState, GameState } from '@firestone/game-state';
import { CardsFacadeService } from '@firestone/shared/framework/core';
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
		return !!state;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		// cardId is the new card id here
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();
		const creatorCardId = gameEvent.additionalData.creatorCardId;
		const lastAffectedByCardId = gameEvent.additionalData.lastAffectedByCardId;

		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;
		const cardInHand = this.helper.findCardInZone(deck.hand, null, entityId);

		const isCardInfoPublic = isPlayer || publicCardCreators.includes(creatorCardId);
		const cardData = cardId != null ? this.allCards.getCard(cardId) : null;
		console.debug('[card-changed-in-hand] cardData', isCardInfoPublic, cardData, cardInHand, deck.hand);
		const newCardInHand = cardInHand
			? cardInHand.update({
					cardId: isCardInfoPublic ? cardId : cardInHand.cardId,
					entityId: entityId,
					// cardName: isCardInfoPublic ? cardData.name : cardInHand.cardName,
					cardName: isCardInfoPublic ? cardData.name : this.allCards.getCard(cardInHand.cardId).name,
					refManaCost: isCardInfoPublic && cardData ? cardData.cost : undefined,
					actualManaCost: isCardInfoPublic && cardData ? cardData.cost : undefined,
					rarity:
						isCardInfoPublic && cardData && cardData.rarity
							? cardData.rarity.toLowerCase()
							: cardInHand.rarity,
					lastAffectedByCardId: lastAffectedByCardId,
			  } as DeckCard)
			: null;
		console.debug('[card-changed-in-hand] newCardInHand', newCardInHand);

		const newHand = newCardInHand ? this.helper.replaceCardInZone(deck.hand, newCardInHand) : deck.hand;
		console.debug('[card-changed-in-hand] newHand', newHand);

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
