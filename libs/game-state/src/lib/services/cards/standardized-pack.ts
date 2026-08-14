/* eslint-disable no-mixed-spaces-and-tabs */
// Standardized Pack (MIS_705): 1 Mana
// "Add 5 random <b>Taunt</b> minions to your hand. They are <b>Temporary</b>."

import { CardIds, CardType, GameTag, hasMechanic, ReferenceCard } from '@firestone-hs/reference-data';

import { hasCorrectType } from '../../related-cards/dynamic-pools';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) => hasCorrectType(c, CardType.MINION) && hasMechanic(c, GameTag.TAUNT);

export const StandardizedPack: StaticGeneratingCard = {
	cardIds: [CardIds.StandardizedPack_MIS_705],
	summonInPlay: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(StandardizedPack.cardIds[0], input.allCards, isMatch, input.inputOptions),
};
