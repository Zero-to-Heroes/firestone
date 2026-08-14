/* eslint-disable no-mixed-spaces-and-tabs */
// Free From Amber (UNG_854): 7 Mana
// "<b>Discover</b> a minion that costs (8) or more. Summon it."

import { CardIds, CardType, ReferenceCard } from '@firestone-hs/reference-data';

import { hasCorrectType, hasCost, canBeDiscoveredByClass } from '../../related-cards/dynamic-pools';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard, currentClass?: string) =>
	hasCorrectType(c, CardType.MINION) && hasCost(c, '>=', 8) && canBeDiscoveredByClass(c, currentClass);

export const FreeFromAmber: StaticGeneratingCard = {
	cardIds: [CardIds.FreeFromAmber],
	summonInPlay: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			FreeFromAmber.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.inputOptions.currentClass),
			input.inputOptions,
		),
};
