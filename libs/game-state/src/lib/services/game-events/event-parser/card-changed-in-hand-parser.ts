import { CardsFacadeService } from '@firestone/shared/framework/core';
import { toTagsObject } from '../../../models/deck-card';
import { DeckState } from '../../../models/deck-state';
import { GameState } from '../../../models/game-state';
import { getProcessedCard } from '../../card-utils';
import { publicCardCreators } from '../../hs-utils';
import { GameEvent } from '../game-event';
import { EventParser } from './_event-parser';
import { DeckManipulationHelper } from './deck-manipulation-helper';

export class CardChangedInHandParser implements EventParser {
	constructor(
		private readonly helper: DeckManipulationHelper,
		private readonly allCards: CardsFacadeService,
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
		const cardData = cardId != null ? getProcessedCard(cardId, entityId, deck, this.allCards) : null;
		console.debug('[card-changed-in-hand] cardData', isCardInfoPublic, cardData, cardInHand, deck.hand);
		const newCardInHand = cardInHand
			? cardInHand.update({
					cardId: isCardInfoPublic ? cardId : cardInHand.cardId,
					entityId: entityId,
					// cardName: isCardInfoPublic ? cardData.name : cardInHand.cardName,
					cardName: isCardInfoPublic ? cardData?.name : this.allCards.getCard(cardInHand.cardId).name,
					refManaCost: isCardInfoPublic && cardData ? cardData.cost : undefined,
					actualManaCost: isCardInfoPublic && cardData ? cardData.cost : undefined,
					rarity:
						isCardInfoPublic && cardData && cardData.rarity
							? cardData.rarity.toLowerCase()
							: cardInHand.rarity,
					lastAffectedByCardId: lastAffectedByCardId,
					tags: gameEvent.additionalData.tags ? toTagsObject(gameEvent.additionalData.tags) : cardInHand.tags,
				})
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
