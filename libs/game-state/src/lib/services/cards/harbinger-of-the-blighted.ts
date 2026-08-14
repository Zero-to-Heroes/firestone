/* eslint-disable no-mixed-spaces-and-tabs */
// Harbinger of the Blighted (EDR_781): 3 Mana 2/3
// "[x]Whenever this enters your hand from the battlefield, summon two random 2-Cost minions."

import { CardIds, CardType, ReferenceCard } from '@firestone-hs/reference-data';

import { hasCorrectType, hasCost } from '../../related-cards/dynamic-pools';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) => hasCorrectType(c, CardType.MINION) && hasCost(c, '==', 3);

export const HarbingerOfTheBlighted: StaticGeneratingCard = {
	cardIds: [CardIds.HarbingerOfTheBlighted_EDR_781],
	summonInPlay: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(HarbingerOfTheBlighted.cardIds[0], input.allCards, isMatch, input.inputOptions),
};
