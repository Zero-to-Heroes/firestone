/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { getCardId, getCardType } from '../card-utils';
import {
	GeneratingCard,
	GuessInfoInput,
	OnCardPlayedWhileInHandCard,
	OnCardPlayedWhileInHandInput,
} from './_card.type';

export const TidepoolPupil: GeneratingCard & OnCardPlayedWhileInHandCard = {
	cardIds: [CardIds.TidepoolPupil_VAC_304],
	publicCreator: true,
	// We need to set the info when the card is created in hand, not when the user mouses over it, so that
	// we can handle the case where the creator is sent back to hand
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		// For player, things are handled more accurately
		if (!input.deckState.isOpponent) {
			return null;
		}

		const deckState = input.deckState;
		const pupil = deckState.findCard(input.card.creatorEntityId)?.card;
		// FIXME: possible bug: a card enter the hand before the pupil, but at the same turn
		// this card will be flagged
		let timestampAtWhichCardEnteredHand = pupil?.metaInfo?.timestampAtWhichCardEnteredHand;
		if (timestampAtWhichCardEnteredHand == null) {
			return null;
		}

		const possibleCards = deckState.cardsPlayedThisMatch
			.filter((c) => (c.timestamp ?? 0) >= (timestampAtWhichCardEnteredHand as number))
			.filter((c) => getCardType(c.cardId, c.entityId, deckState, input.allCards) === CardType.SPELL)
			// .sort((a, b) => a.turn - b.turn) // Don't re-sort
			.slice(0, 3)
			.map((c) => getCardId(c.cardId, c.entityId, deckState, input.allCards)) as readonly string[];
		if (!possibleCards?.length) {
			return null;
		}

		return {
			possibleCards: possibleCards,
		};
	},
	onCardPlayedWhileInHand: (input: OnCardPlayedWhileInHandInput) => {
		const refCard = input.allCards.getCard(input.cardIdPlayed);
		if (refCard?.type?.toUpperCase() !== CardType[CardType.SPELL]) {
			return input.deckState;
		}

		const newRelatedCardIds = [...input.card.relatedCardIds!, input.cardIdPlayed].slice(0, 3);
		const newCard = input.card.update({
			relatedCardIds: newRelatedCardIds,
		});
		return input.deckState.update({
			hand: input.deckState.hand.map((c) => (c === input.card ? newCard : c)),
		});
	},
};
