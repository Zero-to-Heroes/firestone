/* eslint-disable no-mixed-spaces-and-tabs */
// In Formation! (SCH_525): 2 Mana
// "Add 2 random <b>Taunt</b> minions to your hand."

import { CardIds, CardType, GameTag, hasMechanic, ReferenceCard } from '@firestone-hs/reference-data';

import { hasCorrectType } from '../../related-cards/dynamic-pools';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) => hasCorrectType(c, CardType.MINION) && hasMechanic(c, GameTag.TAUNT);

export const InFormation: StaticGeneratingCard = {
	cardIds: [CardIds.InFormation],
	summonInPlay: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(InFormation.cardIds[0], input.allCards, isMatch, input.inputOptions),
};
