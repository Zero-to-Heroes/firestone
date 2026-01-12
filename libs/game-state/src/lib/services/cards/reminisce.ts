/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { GeneratingCard, GuessInfoInput } from './_card.type';

// Reminisce (TOT_343)
// "Add two random cards your opponent played this game to your hand."
export const Reminisce: GeneratingCard = {
	cardIds: [CardIds.Reminisce],
	publicCreator: true,
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards =
			input.opponentDeckState.cardsPlayedThisMatch
				?.map((c) => c.cardId)
				.filter((c) => !!c)
				.filter((c, index, self) => self.indexOf(c) === index) ?? [];
		return {
			possibleCards: possibleCards,
		};
	},
};
