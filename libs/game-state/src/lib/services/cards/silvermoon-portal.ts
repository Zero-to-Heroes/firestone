// Silvermoon Portal (KAR_077, CORE_KAR_077, WON_309)
// 3-Cost Paladin Spell
// Give a minion +2/+2. Summon a random 2-Cost minion.

import { CardIds, CardType } from '@firestone-hs/reference-data';
import { hasCost, hasCorrectType } from '../../related-cards/dynamic-pools';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const SilvermoonPortal: StaticGeneratingCard = {
	cardIds: [CardIds.SilvermoonPortal, CardIds.SilvermoonPortal_CORE_KAR_077, CardIds.SilvermoonPortal_WON_309],
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			SilvermoonPortal.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.MINION) && hasCost(c, '==', 2),
			input.inputOptions,
		);
	},
};
