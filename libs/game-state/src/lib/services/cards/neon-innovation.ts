/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType, Race } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { GeneratingCard, GuessInfoInput } from './_card.type';

export const NeonInnovation: GeneratingCard = {
	cardIds: [CardIds.NeonInnovation_TIME_016],
	publicCreator: true,
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		return {
			cardType: CardType.MINION,
			races: [Race.MECH],
		};
	},
};
