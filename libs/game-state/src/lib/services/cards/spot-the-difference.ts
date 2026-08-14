/* eslint-disable no-mixed-spaces-and-tabs */
// Spot the Difference (TOY_374): 4 Mana
// "<b>Discover</b> a 3-Cost minion to summon. If your deck has no minions, repeat this."

import { CardIds, CardType, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, hasCost, canBeDiscoveredByClass } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard, currentClass?: string) =>
	hasCorrectType(c, CardType.MINION) && hasCost(c, '==', 3) && canBeDiscoveredByClass(c, currentClass);

export const SpotTheDifference: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.SpotTheDifference_TOY_374],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			SpotTheDifference.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.inputOptions.currentClass),
			input.inputOptions,
		),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			SpotTheDifference.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.options.currentClass),
			input.options,
		);
		return { cardType: CardType.MINION, cost: 3, possibleCards };
	},
};
