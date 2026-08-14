/* eslint-disable no-mixed-spaces-and-tabs */
// Huddle Up (WORK_012): 7 Mana
// "Fill your board with random Naga."

import { CardIds, CardType, Race, hasCorrectTribe, ReferenceCard } from '@firestone-hs/reference-data';

import { hasCorrectType } from '../../related-cards/dynamic-pools';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) => hasCorrectType(c, CardType.MINION) && hasCorrectTribe(c, Race.NAGA);

export const HuddleUp: StaticGeneratingCard = {
	cardIds: [CardIds.HuddleUp_WORK_012],
	summonInPlay: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(HuddleUp.cardIds[0], input.allCards, isMatch, input.inputOptions),
};
