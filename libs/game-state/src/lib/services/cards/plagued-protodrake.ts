/* eslint-disable no-mixed-spaces-and-tabs */
// Plagued Protodrake (SCH_711): 8 Mana 8/8 DRAGON
// "<b>Deathrattle:</b> Summon a random 7-Cost minion."

import { CardIds, CardType, ReferenceCard } from '@firestone-hs/reference-data';

import { hasCorrectType, hasCost } from '../../related-cards/dynamic-pools';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) => hasCorrectType(c, CardType.MINION) && hasCost(c, '==', 7);

export const PlaguedProtodrake: StaticGeneratingCard = {
	cardIds: [CardIds.PlaguedProtodrake],
	summonInPlay: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(PlaguedProtodrake.cardIds[0], input.allCards, isMatch, input.inputOptions),
};
