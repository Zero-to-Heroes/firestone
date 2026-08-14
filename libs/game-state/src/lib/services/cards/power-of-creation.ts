/* eslint-disable no-mixed-spaces-and-tabs */
// Power of Creation (DAL_578): 8 Mana
// "<b>Discover</b> a 6-Cost minion. Summon two copies of it."

import { CardIds, CardType, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, hasCost, canBeDiscoveredByClass } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard, currentClass?: string) =>
	hasCorrectType(c, CardType.MINION) && hasCost(c, '==', 6) && canBeDiscoveredByClass(c, currentClass);

export const PowerOfCreation: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.PowerOfCreation],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			PowerOfCreation.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.inputOptions.currentClass),
			input.inputOptions,
		),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			PowerOfCreation.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.options.currentClass),
			input.options,
		);
		return { cardType: CardType.MINION, cost: 6, possibleCards };
	},
};
