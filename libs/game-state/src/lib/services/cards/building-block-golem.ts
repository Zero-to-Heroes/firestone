/* eslint-disable no-mixed-spaces-and-tabs */
// Building-Block Golem (MIS_314): 5 Mana 6/3
// "[x]<b>Rush</b> <b>Deathrattle:</b> Summon three random 1-Cost minions."

import { CardIds, CardType, ReferenceCard } from '@firestone-hs/reference-data';

import { hasCorrectType, hasCost } from '../../related-cards/dynamic-pools';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) => hasCorrectType(c, CardType.MINION) && hasCost(c, '==', 1);

export const BuildingBlockGolem: StaticGeneratingCard = {
	cardIds: [CardIds.BuildingBlockGolem_MIS_314],
	summonInPlay: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(BuildingBlockGolem.cardIds[0], input.allCards, isMatch, input.inputOptions),
};
