/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType, Race } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { GeneratingCard, GuessInfoInput } from './_card.type';

export const ScaleReplica: GeneratingCard = {
	cardIds: [CardIds.ScaleReplica_TOY_387],
	hasSequenceInfo: true,
	publicTutor: true,
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		if (input.card.createdIndex === 0) {
			return {
				cardType: CardType.MINION,
				races: [Race.DRAGON],
			};
		} else if (input.card.createdIndex === 1) {
			return {
				cardType: CardType.MINION,
				races: [Race.DRAGON],
			};
		}
		return null;
	},
};
