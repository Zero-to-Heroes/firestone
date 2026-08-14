/* eslint-disable no-mixed-spaces-and-tabs */
// Bloodpetal Biome (TLC_449): 1 Mana
// "<b>Discover</b> a <b>Temporary</b> 1-Cost minion."

import { CardIds, CardType, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, hasCost, canBeDiscoveredByClass } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard, currentClass?: string) =>
	hasCorrectType(c, CardType.MINION) && hasCost(c, '==', 1) && canBeDiscoveredByClass(c, currentClass);

export const BloodpetalBiome: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.BloodpetalBiome_TLC_449],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			BloodpetalBiome.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.inputOptions.currentClass),
			input.inputOptions,
		),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			BloodpetalBiome.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.options.currentClass),
			input.options,
		);
		return { cardType: CardType.MINION, cost: 1, possibleCards };
	},
};
