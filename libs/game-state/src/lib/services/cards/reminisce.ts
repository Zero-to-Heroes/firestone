/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';

// Reminisce (TOT_343)
// "Get copies of the last two cards your opponent played."
export const Reminisce: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.Reminisce],
	hasSequenceInfo: true,
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		const cardsPlayed = input.inputOptions.opponentDeckState.cardsPlayedThisMatch ?? [];
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
		
		return lastTwoCards;
	},
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
		
		// Use createdIndex to identify which card is which
		// createdIndex 0 = last card played, createdIndex 1 = second-to-last card
		const targetCard = sortedCards[input.card.createdIndex ?? 0];
		if (!targetCard?.cardId) {
			return null;
		}
		
		return {
			possibleCards: [targetCard.cardId],
		};
	},
};
