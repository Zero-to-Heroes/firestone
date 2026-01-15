/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { GeneratingCard, GuessInfoInput } from './_card.type';

// Reminisce (TOT_343)
// "Get copies of the last two cards your opponent played."
export const Reminisce: GeneratingCard = {
	cardIds: [CardIds.Reminisce],
	publicCreator: true,
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const cardsPlayed = input.opponentDeckState.cardsPlayedThisMatch ?? [];
		// Sort by turn (descending) and timestamp (descending) to get the most recent cards first
		const sortedCards = [...cardsPlayed].sort((a, b) => {
			if (b.turn !== a.turn) {
				return b.turn - a.turn;
			}
			// If turns are equal, sort by timestamp (most recent first)
			return (b.timestamp ?? 0) - (a.timestamp ?? 0);
		});
		
		// Get the last two cards played
		const lastTwoCards = sortedCards
			.slice(0, 2)
			.map((c) => c.cardId)
			.filter((c) => !!c);
		
		return {
			possibleCards: lastTwoCards,
		};
	},
};
