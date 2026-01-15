/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { ShortCardWithTurn } from '../../models/game-state';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';

// Reminisce (TOT_343)
// "Get copies of the last two cards your opponent played."
const sortCardsByRecency = (cards: readonly ShortCardWithTurn[]): ShortCardWithTurn[] => {
	return [...cards].sort((a, b) => {
		if (b.turn !== a.turn) {
			return b.turn - a.turn;
		}
		// If turns are equal, sort by timestamp (most recent first)
		return (b.timestamp ?? 0) - (a.timestamp ?? 0);
	});
};

export const Reminisce: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.Reminisce],
	hasSequenceInfo: true,
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		const cardsPlayed = input.inputOptions.opponentDeckState.cardsPlayedThisMatch ?? [];
		const sortedCards = sortCardsByRecency(cardsPlayed);
		
		// Get the last two cards played
		const lastTwoCards = sortedCards
			.slice(0, 2)
			.map((c) => c.cardId)
			.filter((c) => !!c);
		
		return lastTwoCards;
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const cardsPlayed = input.opponentDeckState.cardsPlayedThisMatch ?? [];
		const sortedCards = sortCardsByRecency(cardsPlayed);
		
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
