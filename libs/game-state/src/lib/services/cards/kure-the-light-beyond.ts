/* eslint-disable no-mixed-spaces-and-tabs */
// K'ure, the Light Beyond (GDB_442): 3 Mana 3/3
// "[x]<b><b>Spellburst</b>:</b> Summon a random 3-Cost minion. <i>(Holy spells don't remove this <b>Spellburst</b>.)</i>"

import { CardIds, CardType, ReferenceCard } from '@firestone-hs/reference-data';

import { hasCorrectType, hasCost } from '../../related-cards/dynamic-pools';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) => hasCorrectType(c, CardType.MINION) && hasCost(c, '==', 3);

export const KureTheLightBeyond: StaticGeneratingCard = {
	cardIds: [CardIds.KureTheLightBeyond_GDB_442],
	summonInPlay: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(KureTheLightBeyond.cardIds[0], input.allCards, isMatch, input.inputOptions),
};
