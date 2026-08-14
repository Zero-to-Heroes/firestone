/* eslint-disable no-mixed-spaces-and-tabs */
// Ysondre (EDR_465): 7 Mana 8/5 DRAGON
// "[x]<b>Taunt</b>. <b>Deathrattle:</b> Summon a random Dragon for each time Ysondre has died this game."

import { CardIds, CardType, Race, hasCorrectTribe, ReferenceCard } from '@firestone-hs/reference-data';

import { hasCorrectType } from '../../related-cards/dynamic-pools';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) => hasCorrectType(c, CardType.MINION) && hasCorrectTribe(c, Race.DRAGON);

export const Ysondre: StaticGeneratingCard = {
	cardIds: [CardIds.Ysondre_EDR_465],
	summonInPlay: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(Ysondre.cardIds[0], input.allCards, isMatch, input.inputOptions),
};
