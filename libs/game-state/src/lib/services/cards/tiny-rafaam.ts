/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds } from '@firestone-hs/reference-data';
import { DeckCard, GuessedInfo } from '../../models/deck-card';
import { timeRafaamFablePackage } from '../card-utils';
import { GeneratingCard, GuessInfoInput } from './_card.type';

export const TinyRafaam: GeneratingCard = {
	cardIds: [CardIds.TimethiefRafaam_TinyRafaamToken_TIME_005t1],
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		return {
			possibleCards: timeRafaamFablePackage,
		};
	},
};
