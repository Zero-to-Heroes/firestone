/* eslint-disable no-mixed-spaces-and-tabs */
// Karazhan the Sanctum (TIME_890t2): 10 Mana
// "Costs (0) if you're wielding Atiesh. Summon two random 8-Cost minions."

import { CardIds, CardType, ReferenceCard } from '@firestone-hs/reference-data';

import { hasCorrectType, hasCost } from '../../related-cards/dynamic-pools';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) => hasCorrectType(c, CardType.MINION) && hasCost(c, '==', 8);

export const KarazhanTheSanctum: StaticGeneratingCard = {
	cardIds: [CardIds.MedivhTheHallowed_KarazhanTheSanctumToken_TIME_890t2],
	summonInPlay: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(KarazhanTheSanctum.cardIds[0], input.allCards, isMatch, input.inputOptions),
};
