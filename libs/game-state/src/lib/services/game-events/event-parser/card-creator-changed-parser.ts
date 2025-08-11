import { CardIds, ReferenceCard } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { DeckState } from '../../../models/deck-state';
import { GameState } from '../../../models/game-state';
import { creatorChangeMeansCardChanged, forcedHiddenCardCreators } from '../../hs-utils';
import { GameEvent } from '../game-event';
import { EventParser } from './_event-parser';
import { reverseIfNeeded } from './card-dredged-parser';
import { DeckManipulationHelper } from './deck-manipulation-helper';

export class CardCreatorChangedParser implements EventParser {
	constructor(
		private readonly helper: DeckManipulationHelper,
		private readonly allCards: CardsFacadeService,
	) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [, controllerId, localPlayer, entityId] = gameEvent.parse();
		const isPlayer = reverseIfNeeded(controllerId === localPlayer.PlayerId, gameEvent.additionalData.creatorCardId);
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;

		// Issue: Mask of Mimicry has an info leak where it changes teh DISPLAYED_CREATOR tag
		// for cards in hand
		const cardInHand = this.helper.findCardInZone(deck.hand, null, entityId);
		const cardInDeck = this.helper.findCardInZone(deck.deck, null, entityId);

		// See receive-card-in-hand-parser
		const isSpecialCasePublic =
			!isPlayer &&
			// There isn't a whitelist here, because the CREATOR_CHANGED event assumes the info is public
			!forcedHiddenCardCreators.includes(gameEvent.additionalData.creatorCardId as CardIds);
		// || (isPlayer && !hideInfoWhenPlayerPlaysIt.includes(gameEvent.additionalData.creatorCardId as CardIds));
		const isCardInfoPublic = isPlayer || isSpecialCasePublic;
		const isCardChanged =
			!isPlayer && creatorChangeMeansCardChanged.includes(gameEvent.additionalData.creatorCardId as CardIds);
		const newRefCard = getNewRefCard(gameEvent.additionalData.creatorCardId, this.allCards);

		const newCardInHand = cardInHand
			?.update({
				cardId: isCardChanged ? undefined : cardInHand.cardId,
				cardName: isCardChanged ? undefined : cardInHand.cardName,
				refManaCost: isCardChanged ? undefined : cardInHand.refManaCost,
				rarity: isCardChanged ? undefined : cardInHand.rarity,
				actualManaCost: isCardChanged ? undefined : cardInHand.actualManaCost,
				cardType: isCardChanged ? undefined : cardInHand.cardType,
				inInitialDeck: isCardChanged ? false : cardInHand.inInitialDeck,
				forged: isCardChanged ? undefined : cardInHand.forged,
				relatedCardIds: isCardChanged ? undefined : cardInHand.relatedCardIds,

				// To avoid info leaks from Mask of Mimicry
				creatorCardId: isCardInfoPublic ? gameEvent.additionalData.creatorCardId : cardInHand.creatorCardId,
				creatorEntityId: isCardInfoPublic
					? gameEvent.additionalData.creatorEntityId
					: cardInHand.creatorEntityId,
				lastAffectedByCardId: undefined,
				guessedInfo: isCardInfoPublic ? cardInHand.guessedInfo : {},
			})
			?.update(
				!newRefCard
					? null
					: {
							cardId: newRefCard.id,
							cardName: newRefCard.name,
							refManaCost: newRefCard.cost,
							rarity: newRefCard.rarity,
							cardType: newRefCard.type,
						},
			);

		const newCardInDeck = cardInDeck
			? cardInDeck.update({
					creatorCardId: gameEvent.additionalData.creatorCardId,
					creatorEntityId: gameEvent.additionalData.creatorEntityId,
					lastAffectedByCardId: undefined,
					// So that we keep information added by the creator card, like the card type
					guessedInfo: cardInDeck.guessedInfo,
				})
			: null;

		const newHand = newCardInHand ? this.helper.replaceCardInZone(deck.hand, newCardInHand) : deck.hand;
		const newDeck = newCardInDeck ? this.helper.replaceCardInZone(deck.deck, newCardInDeck) : deck.deck;

		const newPlayerDeck = Object.assign(new DeckState(), deck, {
			hand: newHand,
			deck: newDeck,
		});
		return Object.assign(new GameState(), currentState, {
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
		});
	}

	event(): string {
		return GameEvent.CARD_CREATOR_CHANGED;
	}
}

const getNewRefCard = (creatorCardId: string, allCards: CardsFacadeService): ReferenceCard | null => {
	switch (creatorCardId) {
		case CardIds.Shenanigans:
			return allCards.getCard(CardIds.KingMukla_BananasLegacyToken);
		default:
			return null;
	}
};
