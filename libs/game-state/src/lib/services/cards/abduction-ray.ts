/* eslint-disable no-mixed-spaces-and-tabs */
// Abduction Ray (GDB_123): 1 Mana
// "Get a random Demon. Reduce its Cost by (2). Repeatable this turn."

import { CardIds, CardType, Race, hasCorrectTribe, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) => hasCorrectType(c, CardType.MINION) && hasCorrectTribe(c, Race.DEMON);

export const AbductionRay: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.AbductionRay_GDB_123],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(AbductionRay.cardIds[0], input.allCards, isMatch, input.inputOptions),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(AbductionRay.cardIds[0], input.allCards, isMatch, input.options);
		return { cardType: CardType.MINION, races: [Race.DEMON], possibleCards };
	},
};
