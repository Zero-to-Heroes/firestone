/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { GeneratingCard, GuessInfoInput } from './_card.type';

export const Thoughtsteal: GeneratingCard = {
	cardIds: [CardIds.ThoughtstealLegacy, CardIds.ThoughtstealVanilla],
	publicCreator: true,
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = input.opponentDeckState.deck.map((c) => c.cardId).filter((c) => !!c);
		return {
			possibleCards: possibleCards,
		};
	},
};
