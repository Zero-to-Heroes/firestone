/* eslint-disable no-mixed-spaces-and-tabs */
// Past Conflux (TIME_436): 7 Mana
// "[x]Summon a random Dragon that costs (5) or more. <i>Advance to the present!</i>"

import { CardIds, CardType, Race, hasCorrectTribe, ReferenceCard } from '@firestone-hs/reference-data';

import { hasCorrectType, hasCost } from '../../related-cards/dynamic-pools';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) =>
	hasCorrectType(c, CardType.MINION) && hasCorrectTribe(c, Race.DRAGON) && hasCost(c, '>=', 5);

export const PastConflux: StaticGeneratingCard = {
	cardIds: [CardIds.PastConflux_TIME_436],
	summonInPlay: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(PastConflux.cardIds[0], input.allCards, isMatch, input.inputOptions),
};
