/* eslint-disable no-mixed-spaces-and-tabs */
// Bitterbloom Knight (EDR_852): 3 Mana 2/3
// "<b>Battlecry:</b> Imbue your Hero Power."

import { CardIds } from '@firestone-hs/reference-data';
import { IMBUED_HERO_POWERS } from '../../related-cards/dynamic-pools';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';

export const BitterbloomKnight: StaticGeneratingCard = {
	cardIds: [CardIds.BitterbloomKnight_EDR_852],
	overrideDefaultDynamicPool: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		IMBUED_HERO_POWERS.filter((hp) =>
			input.allCards.getCard(hp).classes?.includes(input.inputOptions.currentClass),
		),
};
