/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { getCardId, getCardType } from '../card-utils';
import { GeneratingCard, GuessInfoInput } from './_card.type';

export const TidepoolPupil: GeneratingCard = {
	cardIds: [CardIds.TidepoolPupil_VAC_304],
	publicCreator: true,
	// We need to set the info when the card is created in hand, not when the user mouses over it, so that
	// we can handle the case where the creator is sent back to hand
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		console.debug('[debug] considering TidepoolPupil', input);
		// For player, things are handled more accurately
		if (!input.deckState.isOpponent) {
			return null;
		}

		const deckState = input.deckState;
		const pupil = deckState.findCard(input.card.creatorEntityId)?.card;
		console.debug('[debug] pupil', pupil, deckState);
		// FIXME: possible bug: a card enter the hand before the pupil, but at the same turn
		// this card will be flagged
		let timestampAtWhichCardEnteredHand = pupil?.metaInfo?.timestampAtWhichCardEnteredHand;
		console.debug('[debug] timestampAtWhichCardEnteredHand', timestampAtWhichCardEnteredHand, new Date(timestampAtWhichCardEnteredHand as number).toISOString());
		if (timestampAtWhichCardEnteredHand == null) {
			return null;
		}


		console.debug('[debug] candidates', deckState.cardsPlayedThisMatch
			.filter((c) => (c.timestamp ?? 0) >= (timestampAtWhichCardEnteredHand as number)),
			deckState.cardsPlayedThisMatch
				.map((c) => ({
					cardId: c.cardId,
					readableDate: new Date(c.timestamp ?? 0).toISOString(),
					timestamp: c.timestamp,
					delta: (c.timestamp ?? 0) - (timestampAtWhichCardEnteredHand as number)
				})))

		const possibleCards =
			deckState.cardsPlayedThisMatch
				.filter((c) => (c.timestamp ?? 0) >= (timestampAtWhichCardEnteredHand as number))
				.filter((c) => getCardType(c.cardId, c.entityId, deckState, input.allCards) === CardType.SPELL)
				// .sort((a, b) => a.turn - b.turn) // Don't re-sort
				.slice(0, 3)
				.map((c) => getCardId(c.cardId, c.entityId, deckState, input.allCards)) as readonly string[]
		if (!possibleCards?.length) {
			return null;
		}

		return {
			possibleCards: possibleCards
		}
	},
};
