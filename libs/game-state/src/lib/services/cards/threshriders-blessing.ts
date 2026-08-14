/* eslint-disable no-mixed-spaces-and-tabs */
// Threshrider's Blessing (TLC_477): 5 Mana
// "Give a friendly minion +4/+4 and "<b>Deathrattle:</b> Summon a random 4-Cost minion.""

import { CardIds, CardType, ReferenceCard } from '@firestone-hs/reference-data';

import { hasCorrectType, hasCost } from '../../related-cards/dynamic-pools';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) => hasCorrectType(c, CardType.MINION) && hasCost(c, '==', 4);

export const ThreshridersBlessing: StaticGeneratingCard = {
	cardIds: [CardIds.ThreshridersBlessing_TLC_477],
	summonInPlay: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(ThreshridersBlessing.cardIds[0], input.allCards, isMatch, input.inputOptions),
};
