/* eslint-disable no-mixed-spaces-and-tabs */
// Linedance Partner (WW_433): 3 Mana 3/2
// "<b>Battlecry:</b> If you're holding another 3-Cost card, summon a random 3-Cost minion."

import { CardIds, CardType, ReferenceCard } from '@firestone-hs/reference-data';

import { hasCorrectType, hasCost } from '../../related-cards/dynamic-pools';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) => hasCorrectType(c, CardType.MINION) && hasCost(c, '==', 3);

export const LinedancePartner: StaticGeneratingCard = {
	cardIds: [CardIds.LinedancePartner_WW_433],
	summonInPlay: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(LinedancePartner.cardIds[0], input.allCards, isMatch, input.inputOptions),
};
