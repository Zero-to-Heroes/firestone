/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { GeneratingCard, GuessInfoInput } from './_card.type';

export const TheCurator: GeneratingCard = {
	cardIds: [CardIds.TheCurator_KAR_061, CardIds.TheCurator_CORE_KAR_061],
	hasSequenceInfo: true,
	publicTutor: true,
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		if (input.card.createdIndex === 0) {
			return {
				cardType: CardType.MINION,
			};
		} else if (input.card.createdIndex === 1) {
			return {
				cardType: CardType.MINION,
			};
		} else if (input.card.createdIndex === 2) {
			return {
				cardType: CardType.MINION,
			};
		}
		return null;
	},
};
