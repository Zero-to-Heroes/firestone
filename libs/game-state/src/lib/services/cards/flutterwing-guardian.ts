/* eslint-disable no-mixed-spaces-and-tabs */
// Flutterwing Guardian (EDR_800): 4 Mana 3/4
// "<b>Taunt</b>. <b>Battlecry:</b> Imbue your Hero Power."

import { CardIds } from '@firestone-hs/reference-data';
import { IMBUED_HERO_POWERS } from '../../related-cards/dynamic-pools';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';

export const FlutterwingGuardian: StaticGeneratingCard = {
	cardIds: [CardIds.FlutterwingGuardian_EDR_800],
	overrideDefaultDynamicPool: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		IMBUED_HERO_POWERS.filter((hp) =>
			input.allCards.getCard(hp).classes?.includes(input.inputOptions.currentClass),
		),
};
