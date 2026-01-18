/* eslint-disable no-mixed-spaces-and-tabs */
// Convoke the Spirits (REV_365): 10 Mana Druid spell
// "Cast 8 random Druid spells (targets chosen randomly)."
// The spells are cast directly, not added to hand, so only dynamicPool is needed

import { CardClass, CardIds, CardType } from '@firestone-hs/reference-data';
import { hasCorrectClass, hasCorrectType } from '../../related-cards/dynamic-pools';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const ConvokeTheSpirits: StaticGeneratingCard = {
	cardIds: [CardIds.ConvokeTheSpirits, CardIds.ConvokeTheSpirits_CORE_REV_365],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			ConvokeTheSpirits.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.SPELL) && hasCorrectClass(c, CardClass.DRUID),
			input.inputOptions,
		);
	},
};
