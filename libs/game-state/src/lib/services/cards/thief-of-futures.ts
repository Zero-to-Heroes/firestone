/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { GeneratingCard, GuessInfoInput } from './_card.type';

// Thief of Futures (TOT_107)
// "<b>Battlecry:</b> Add a copy of the top card of your opponent's deck to your hand."
export const ThiefOfFutures: GeneratingCard = {
	cardIds: [CardIds.ThiefOfFutures],
	publicCreator: true,
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		// Top card of opponent's deck
		const topCard = input.opponentDeckState.deck?.[0];
		const possibleCards = topCard ? [topCard.cardId] : [];
		return {
			possibleCards: possibleCards.filter((c) => !!c),
		};
	},
};
