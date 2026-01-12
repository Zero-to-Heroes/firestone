/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType } from '@firestone-hs/reference-data';
import { hasCorrectType } from '../../related-cards/dynamic-pools';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

// Master of Realities (TOT_313)
// "After you summon a minion, transform it into a random minion that costs (2) more."
export const MasterOfRealities: StaticGeneratingCard = {
	cardIds: [CardIds.MasterOfRealities_TOT_313],
	publicCreator: false,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		// This will need context of the summoned minion's cost to determine the pool
		// For now, return all minions as the pool depends on runtime information
		return filterCards(
			MasterOfRealities.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.MINION),
			input.inputOptions,
		);
	},
};
