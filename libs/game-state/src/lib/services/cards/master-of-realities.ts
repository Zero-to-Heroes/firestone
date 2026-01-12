/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType } from '@firestone-hs/reference-data';
import { hasCorrectType } from '../../related-cards/dynamic-pools';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

// Master of Realities (TOT_313)
// "After you summon a minion, transform it into a random minion that costs (2) more."
// Note: This returns all minions as the specific cost filter requires runtime context
// about which minion was summoned. The actual transformation logic happens in game engine.
export const MasterOfRealities: StaticGeneratingCard = {
	cardIds: [CardIds.MasterOfRealities_TOT_313],
	publicCreator: false,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		// Returns all minions since the cost filter depends on the summoned minion's cost
		// which is only known at runtime, not at deck building time
		return filterCards(
			MasterOfRealities.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.MINION),
			input.inputOptions,
		);
	},
};
