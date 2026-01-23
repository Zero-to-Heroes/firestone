/* eslint-disable no-mixed-spaces-and-tabs */
// Thief of Futures
// Battlecry: Steal the top card of your opponent's deck.
import { CardIds, GameTag } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { GeneratingCard, GuessInfoInput } from './_card.type';

export const ThiefOfFutures: GeneratingCard = {
	cardIds: [CardIds.ThiefOfFutures],
	publicCreator: true,
	publicTutor: true,
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = input.opponentDeckState.deck.map((c) => c.cardId).filter((c) => !!c)
			// These are revealed right away
			.filter(c => !input.allCards.getCard(c).mechanics?.includes(GameTag[GameTag.CASTS_WHEN_DRAWN])
				&& !input.allCards.getCard(c).mechanics?.includes(GameTag[GameTag.SUMMONED_WHEN_DRAWN]))
		return {
			possibleCards,
		};
	},
};
