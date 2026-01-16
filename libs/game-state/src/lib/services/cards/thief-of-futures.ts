/* eslint-disable no-mixed-spaces-and-tabs */
// Thief of Futures
// Battlecry: Steal the top card of your opponent's deck.
import { CardIds } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { GeneratingCard, GuessInfoInput } from './_card.type';

export const ThiefOfFutures: GeneratingCard = {
	cardIds: [CardIds.ThiefOfFutures],
	publicCreator: true,
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = input.opponentDeckState.deck.map((c) => c.cardId).filter((c) => !!c);
		return {
			possibleCards: possibleCards,
		};
	},
};
