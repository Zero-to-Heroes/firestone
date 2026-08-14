/* eslint-disable no-mixed-spaces-and-tabs */
// Paltry Flutterwing (TIME_058): 1 Mana 1/1 BEAST
// "[x]<b>Deathrattle:</b> Summon a random 2-Cost minion that is <b>Dormant</b> for 2 turns."

import { CardIds, CardType, ReferenceCard } from '@firestone-hs/reference-data';

import { hasCorrectType, hasCost } from '../../related-cards/dynamic-pools';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) => hasCorrectType(c, CardType.MINION) && hasCost(c, '==', 2);

export const PaltryFlutterwing: StaticGeneratingCard = {
	cardIds: [CardIds.PaltryFlutterwing_TIME_058],
	summonInPlay: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(PaltryFlutterwing.cardIds[0], input.allCards, isMatch, input.inputOptions),
};
