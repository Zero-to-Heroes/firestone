/* eslint-disable no-mixed-spaces-and-tabs */
// Big Bad Archmage (DAL_553): 10 Mana 6/6
// "At the end of your turn, summon a random 6-Cost minion."

import { CardIds, CardType, ReferenceCard } from '@firestone-hs/reference-data';

import { hasCorrectType, hasCost } from '../../related-cards/dynamic-pools';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) => hasCorrectType(c, CardType.MINION) && hasCost(c, '==', 6);

export const BigBadArchmage: StaticGeneratingCard = {
	cardIds: [CardIds.BigBadArchmage],
	summonInPlay: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(BigBadArchmage.cardIds[0], input.allCards, isMatch, input.inputOptions),
};
