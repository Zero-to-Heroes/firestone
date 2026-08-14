/* eslint-disable no-mixed-spaces-and-tabs */
// Jandice Barov (SCH_351): 5 Mana 2/1
// "[x]<b>Battlecry:</b> Summon two random 5-Cost minions. Secretly pick one that dies when it takes damage."

import { CardIds, CardType, ReferenceCard } from '@firestone-hs/reference-data';

import { hasCorrectType, hasCost } from '../../related-cards/dynamic-pools';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) => hasCorrectType(c, CardType.MINION) && hasCost(c, '==', 5);

export const JandiceBarov: StaticGeneratingCard = {
	cardIds: [CardIds.JandiceBarov_SCH_351],
	summonInPlay: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(JandiceBarov.cardIds[0], input.allCards, isMatch, input.inputOptions),
};
