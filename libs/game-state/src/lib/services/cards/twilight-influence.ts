/* eslint-disable no-mixed-spaces-and-tabs */
// Twilight Influence (EDR_463 / EDR_463b): 2 Mana
// "<b>Choose One -</b> Destroy a minion with 3 or less Attack; or Summon a random 2-Cost minion."

import { CardIds, CardType, ReferenceCard } from '@firestone-hs/reference-data';

import { hasCorrectType, hasCost } from '../../related-cards/dynamic-pools';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) => hasCorrectType(c, CardType.MINION) && hasCost(c, '==', 2);

export const TwilightInfluence: StaticGeneratingCard = {
	cardIds: [CardIds.TwilightInfluence_EDR_463, CardIds.TwilightInfluence_ControllingVines_EDR_463b],
	summonInPlay: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(TwilightInfluence.cardIds[0], input.allCards, isMatch, input.inputOptions),
};
