/* eslint-disable no-mixed-spaces-and-tabs */
// Ward of Earth (EDR_060): 5 Mana
// "Gain 5 Armor. Summon a random 5-Cost minion and give it <b>Taunt</b>."

import { CardIds, CardType, ReferenceCard } from '@firestone-hs/reference-data';

import { hasCorrectType, hasCost } from '../../related-cards/dynamic-pools';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) => hasCorrectType(c, CardType.MINION) && hasCost(c, '==', 5);

export const WardOfEarth: StaticGeneratingCard = {
	cardIds: [CardIds.WardOfEarth_EDR_060],
	summonInPlay: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(WardOfEarth.cardIds[0], input.allCards, isMatch, input.inputOptions),
};
