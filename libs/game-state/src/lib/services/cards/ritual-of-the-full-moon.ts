/* eslint-disable no-mixed-spaces-and-tabs */
// Ritual of the Full Moon (EDR_461t): 5 Mana
// "Summon two random 6-Cost minions."

import { CardIds, CardType, ReferenceCard } from '@firestone-hs/reference-data';

import { hasCorrectType, hasCost } from '../../related-cards/dynamic-pools';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) => hasCorrectType(c, CardType.MINION) && hasCost(c, '==', 6);

export const RitualOfTheFullMoon: StaticGeneratingCard = {
	cardIds: [CardIds.RitualOfTheNewMoon_RitualOfTheFullMoonToken_EDR_461t],
	summonInPlay: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(RitualOfTheFullMoon.cardIds[0], input.allCards, isMatch, input.inputOptions),
};
