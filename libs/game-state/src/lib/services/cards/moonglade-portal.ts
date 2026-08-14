/* eslint-disable no-mixed-spaces-and-tabs */
// Moonglade Portal (KAR_075): 6 Mana
// "Restore #6 Health. Summon a random 6-Cost minion."

import { CardIds, CardType, ReferenceCard } from '@firestone-hs/reference-data';

import { hasCorrectType, hasCost } from '../../related-cards/dynamic-pools';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) => hasCorrectType(c, CardType.MINION) && hasCost(c, '==', 6);

export const MoongladePortal: StaticGeneratingCard = {
	cardIds: [CardIds.MoongladePortal_KAR_075],
	summonInPlay: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(MoongladePortal.cardIds[0], input.allCards, isMatch, input.inputOptions),
};
