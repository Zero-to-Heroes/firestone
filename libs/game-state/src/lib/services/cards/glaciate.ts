// Glaciate (AV_107 / CORE_AV_107): 6 Mana Shaman Spell (Frost)
// "Discover an 8-Cost minion. Summon and Freeze it."

import { CardIds, CardType, ReferenceCard } from '@firestone-hs/reference-data';
import { canBeDiscoveredByClass, hasCorrectType, hasCost } from '../../related-cards/dynamic-pools';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const Glaciate: StaticGeneratingCard = {
	cardIds: [CardIds.Glaciate, CardIds.Glaciate_CORE_AV_107],
	publicCreator: true,
	summonInPlay: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			Glaciate.cardIds[0],
			input.allCards,
			(c: ReferenceCard) =>
				hasCorrectType(c, CardType.MINION) &&
				hasCost(c, '==', 8) &&
				canBeDiscoveredByClass(c, input.inputOptions.currentClass),
			input.inputOptions,
		);
	},
};
