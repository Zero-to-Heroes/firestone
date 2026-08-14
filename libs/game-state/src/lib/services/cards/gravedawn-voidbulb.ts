/* eslint-disable no-mixed-spaces-and-tabs */
// Gravedawn Voidbulb (TLC_815): 4 Mana
// "Summon a random 4-Cost minion and give it <b>Taunt</b>. <b>Kindred:</b> Do it again."

import { CardIds, CardType, ReferenceCard } from '@firestone-hs/reference-data';

import { hasCorrectType, hasCost } from '../../related-cards/dynamic-pools';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) => hasCorrectType(c, CardType.MINION) && hasCost(c, '==', 4);

export const GravedawnVoidbulb: StaticGeneratingCard = {
	cardIds: [CardIds.GravedawnVoidbulb_TLC_815],
	summonInPlay: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(GravedawnVoidbulb.cardIds[0], input.allCards, isMatch, input.inputOptions),
};
