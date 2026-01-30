/* eslint-disable no-mixed-spaces-and-tabs */
// Hybridization (TLC_236): Draw a 1, 2, 3, and 4-Cost minion. Kindred: They cost (1) less.
import { CardIds, CardType } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { GeneratingCard, GuessInfoInput } from './_card.type';

export const Hybridization: GeneratingCard = {
	cardIds: [CardIds.Hybridization_TLC_236],
	hasSequenceInfo: true,
	publicTutor: true,
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		if (input.card.createdIndex === 0) {
			return {
				cardType: CardType.MINION,
				cost: 1,
			};
		} else if (input.card.createdIndex === 1) {
			return {
				cardType: CardType.MINION,
				cost: 2,
			};
		} else if (input.card.createdIndex === 2) {
			return {
				cardType: CardType.MINION,
				cost: 3,
			};
		} else if (input.card.createdIndex === 3) {
			return {
				cardType: CardType.MINION,
				cost: 4,
			};
		}
		return null;
	},
};
