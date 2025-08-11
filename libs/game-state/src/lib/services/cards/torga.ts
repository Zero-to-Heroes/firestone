/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, GameTag } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { GeneratingCard, GuessInfoInput } from './_card.type';

export const Torga: GeneratingCard = {
	cardIds: [CardIds.Torga_TLC_102],
	hasSequenceInfo: true,
	publicTutor: true,
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		if (input.card.createdIndex === 0) {
			return {
				mechanics: [GameTag.KINDRED],
			};
		} else if (input.card.createdIndex === 1) {
			return null;
		}
		return null;
	},
};
