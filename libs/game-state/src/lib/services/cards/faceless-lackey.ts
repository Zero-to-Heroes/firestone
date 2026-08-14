/* eslint-disable no-mixed-spaces-and-tabs */
// Faceless Lackey (DAL_613): 1 Mana 1/1
// "<b>Battlecry:</b> Summon a random 2-Cost minion."

import { CardIds, CardType, ReferenceCard } from '@firestone-hs/reference-data';

import { hasCorrectType, hasCost } from '../../related-cards/dynamic-pools';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) => hasCorrectType(c, CardType.MINION) && hasCost(c, '==', 2);

export const FacelessLackey: StaticGeneratingCard = {
	cardIds: [CardIds.FacelessLackey],
	summonInPlay: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(FacelessLackey.cardIds[0], input.allCards, isMatch, input.inputOptions),
};
