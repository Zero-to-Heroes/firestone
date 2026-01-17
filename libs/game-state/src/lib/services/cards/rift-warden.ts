/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType } from '@firestone-hs/reference-data';
import { hasCorrectType, hasCost } from '../../related-cards/dynamic-pools';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

// Rift Warden (TOT_102)
// "Battlecry: Put a random minion that costs (5) or more on top of your deck. It costs (0)."
export const RiftWarden: StaticGeneratingCard = {
	cardIds: [CardIds.RiftWarden],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			RiftWarden.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.MINION) && hasCost(c, '>=', 5),
			input.inputOptions,
		);
	},
};
