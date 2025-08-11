/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, Race } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { GeneratingCard, GuessInfoInput } from './_card.type';

export const TheEternalHold: GeneratingCard = {
	cardIds: [CardIds.TheEternalHold_TIME_446],
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		return {
			races: [Race.DEMON],
			cost: { cost: 5, comparison: '>=' },
		};
	},
};
