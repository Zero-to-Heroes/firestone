/* eslint-disable no-mixed-spaces-and-tabs */
// Aegis of Light (EDR_264): 2 Mana
// "Summon a random 2-Cost minion and give it <b>Taunt</b>. <b>Imbue</b> your Hero Power."

import { CardIds, CardType, ReferenceCard } from '@firestone-hs/reference-data';

import { hasCorrectType, hasCost } from '../../related-cards/dynamic-pools';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) => hasCorrectType(c, CardType.MINION) && hasCost(c, '==', 2);

export const AegisOfLight: StaticGeneratingCard = {
	cardIds: [CardIds.AegisOfLight_EDR_264],
	summonInPlay: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(AegisOfLight.cardIds[0], input.allCards, isMatch, input.inputOptions),
};
