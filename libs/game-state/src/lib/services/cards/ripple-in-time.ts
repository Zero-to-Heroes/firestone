/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput } from './_card.type';

// Ripple in Time (TOT_345)
// "<b>Discover</b> a minion from your deck. It has <b>Echo</b>."
export const RippleInTime: GeneratingCard = {
	cardIds: [CardIds.RippleInTime],
	publicCreator: true,
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		// Discovers from deck, so we return minions in the deck
		const minionsInDeck =
			input.deckState.deck
				?.map((c) => c.cardId)
				.filter((c) => !!c)
				.filter((cardId) => {
					const card = input.allCards.getCard(cardId);
					return hasCorrectType(card, CardType.MINION);
				})
				.filter((c, index, self) => self.indexOf(c) === index) ?? [];
		return {
			cardType: CardType.MINION,
			possibleCards: minionsInDeck,
		};
	},
};
