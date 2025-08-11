/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { GeneratingCard, GuessInfoInput } from './_card.type';

export const Reforestation: GeneratingCard = {
	cardIds: [CardIds.Reforestation_ReforestationToken_EDR_843t1],
	hasSequenceInfo: true,
	publicTutor: true,
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		if (input.card.createdIndex === 0) {
			return {
				cardType: CardType.SPELL,
			};
		} else if (input.card.createdIndex === 1) {
			return {
				cardType: CardType.MINION,
			};
		}
		return null;
	},
};
