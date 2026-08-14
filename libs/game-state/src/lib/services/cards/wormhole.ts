/* eslint-disable no-mixed-spaces-and-tabs */
// Wormhole (TIME_602): 3 Mana
// "<b>Rewind</b> Summon a random 3-Cost Beast. It attacks a random enemy."

import { CardIds, CardType, Race, hasCorrectTribe, ReferenceCard } from '@firestone-hs/reference-data';

import { hasCorrectType, hasCost } from '../../related-cards/dynamic-pools';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) =>
	hasCorrectType(c, CardType.MINION) && hasCorrectTribe(c, Race.BEAST) && hasCost(c, '==', 3);

export const Wormhole: StaticGeneratingCard = {
	cardIds: [CardIds.Wormhole_TIME_602],
	summonInPlay: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(Wormhole.cardIds[0], input.allCards, isMatch, input.inputOptions),
};
