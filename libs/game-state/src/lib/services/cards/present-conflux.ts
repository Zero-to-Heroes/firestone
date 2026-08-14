/* eslint-disable no-mixed-spaces-and-tabs */
// Present Conflux (TIME_436t1): 7 Mana
// "[x]<b>Discover</b> a Dragon that costs (5) or more and summon it. <i>Advance to the future!</i>"

import { CardIds, CardType, Race, hasCorrectTribe, ReferenceCard } from '@firestone-hs/reference-data';

import { hasCorrectType, hasCost, canBeDiscoveredByClass } from '../../related-cards/dynamic-pools';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard, currentClass?: string) =>
	hasCorrectType(c, CardType.MINION) &&
	hasCorrectTribe(c, Race.DRAGON) &&
	hasCost(c, '>=', 5) &&
	canBeDiscoveredByClass(c, currentClass);

export const PresentConflux: StaticGeneratingCard = {
	cardIds: [CardIds.PastConflux_PresentConfluxToken_TIME_436t1],
	summonInPlay: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			PresentConflux.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.inputOptions.currentClass),
			input.inputOptions,
		),
};
