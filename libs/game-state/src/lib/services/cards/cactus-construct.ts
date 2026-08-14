/* eslint-disable no-mixed-spaces-and-tabs */
// Cactus Construct (WW_818): 1 Mana
// "<b>Discover</b> a 2-Cost minion. Summon a 1/2 copy of it."

import { CardIds, CardType, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, hasCost, canBeDiscoveredByClass } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard, currentClass?: string) =>
	hasCorrectType(c, CardType.MINION) && hasCost(c, '==', 2) && canBeDiscoveredByClass(c, currentClass);

export const CactusConstruct: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.CactusConstruct_WW_818],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			CactusConstruct.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.inputOptions.currentClass),
			input.inputOptions,
		),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			CactusConstruct.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.options.currentClass),
			input.options,
		);
		return { cardType: CardType.MINION, cost: 2, possibleCards };
	},
};
