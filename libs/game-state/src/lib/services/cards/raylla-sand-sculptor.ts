/* eslint-disable no-mixed-spaces-and-tabs */
// Raylla, Sand Sculptor (VAC_424): 4 Mana 2/6 DRAENEI
// "[x]<b>Paladin Tourist</b> After you cast a spell, summon a random 2-Cost minion and give it <b>Divine Shield</b>."

import { CardIds, CardType, ReferenceCard } from '@firestone-hs/reference-data';

import { hasCorrectType, hasCost } from '../../related-cards/dynamic-pools';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) => hasCorrectType(c, CardType.MINION) && hasCost(c, '==', 2);

export const RayllaSandSculptor: StaticGeneratingCard = {
	cardIds: [CardIds.RayllaSandSculptor_VAC_424],
	summonInPlay: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(RayllaSandSculptor.cardIds[0], input.allCards, isMatch, input.inputOptions),
};
