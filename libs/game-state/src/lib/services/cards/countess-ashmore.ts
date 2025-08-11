/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { GeneratingCard, GuessInfoInput } from './_card.type';

export const CountessAshmore: GeneratingCard = {
	cardIds: [CardIds.CountessAshmore],
	hasSequenceInfo: true,
	publicTutor: true,
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		if (input.card.createdIndex === 0) {
			return null;
		} else if (input.card.createdIndex === 1) {
			return null;
		} else if (input.card.createdIndex === 2) {
			return null;
		}
		return null;
	},
};
