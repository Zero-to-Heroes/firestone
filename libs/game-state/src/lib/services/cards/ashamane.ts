/* eslint-disable no-mixed-spaces-and-tabs */
// Ashamane (EDR_527)
// Battlecry: Fill your hand with copies of cards from your opponent's deck. They cost (3) less.
import { CardIds } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { GeneratingCard, GuessInfoInput } from './_card.type';

export const Ashamane: GeneratingCard = {
	cardIds: [CardIds.Ashamane_EDR_527],
	publicCreator: true,
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = input.opponentDeckState.deck.map((c) => c.cardId).filter((c) => !!c);
		return {
			possibleCards: possibleCards,
		};
	},
};
