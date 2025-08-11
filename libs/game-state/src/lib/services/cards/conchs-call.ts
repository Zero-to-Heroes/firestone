/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType, Race } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { GeneratingCard, GuessInfoInput } from './_card.type';

export const ConchsCall: GeneratingCard = {
	cardIds: [CardIds.ConchsCall],
	hasSequenceInfo: true,
	publicTutor: true,
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		if (input.card.createdIndex === 0) {
			return {
				cardType: CardType.MINION,
				races: [Race.NAGA],
			};
		} else if (input.card.createdIndex === 1) {
			return {
				cardType: CardType.SPELL,
			};
		}
		return null;
	},
};
