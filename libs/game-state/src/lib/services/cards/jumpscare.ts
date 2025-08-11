/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType, Race } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { GeneratingCard, GuessInfoInput } from './_card.type';

export const Jumpscare: GeneratingCard = {
	cardIds: [CardIds.Jumpscare_EDR_882],
	publicCreator: true,
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		return {
			cardType: CardType.MINION,
			races: [Race.DEMON],
		};
	},
};
