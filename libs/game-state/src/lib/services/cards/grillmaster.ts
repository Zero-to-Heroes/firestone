/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { GeneratingCard, GuessInfoInput } from './_card.type';

export const Grillmaster: GeneratingCard = {
	cardIds: [CardIds.Grillmaster_VAC_917],
	hasSequenceInfo: true,
	publicTutor: true,
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		return null;
	},
};
