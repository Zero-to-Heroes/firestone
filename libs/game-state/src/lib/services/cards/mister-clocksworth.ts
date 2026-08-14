/* eslint-disable no-mixed-spaces-and-tabs */
// Mister Clocksworth (TIME_038 / TIME_038t1 / TIME_038t2 / TIME_038t3): 8 Mana 3/3 MECH
// "[x]<b>Rewind</b>, <b>Rewind</b>, <b>Rewind</b> <b>Battlecry:</b> Summon 2 random <b>Legendary</b> minions."

import { CardIds, CardType, CardRarity, ReferenceCard } from '@firestone-hs/reference-data';

import { hasCorrectType, hasCorrectRarity } from '../../related-cards/dynamic-pools';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) => hasCorrectType(c, CardType.MINION) && hasCorrectRarity(c, CardRarity.LEGENDARY);

export const MisterClocksworth: StaticGeneratingCard = {
	cardIds: [
		CardIds.MisterClocksworth_TIME_038,
		CardIds.MisterClocksworth_MisterClocksworthToken_TIME_038t1,
		CardIds.MisterClocksworth_MisterClocksworthToken_TIME_038t2,
		CardIds.MisterClocksworth_MisterClocksworthToken_TIME_038t3,
	],
	summonInPlay: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(MisterClocksworth.cardIds[0], input.allCards, isMatch, input.inputOptions),
};
