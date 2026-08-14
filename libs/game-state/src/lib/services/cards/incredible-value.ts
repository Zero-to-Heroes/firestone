/* eslint-disable no-mixed-spaces-and-tabs */
// Incredible Value (TOY_046): 3 Mana
// "<b>Discover</b> a 4-Cost minion. Set its Attack and Health to 7."

import { CardIds, CardType, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, hasCost, canBeDiscoveredByClass } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard, currentClass?: string) =>
	hasCorrectType(c, CardType.MINION) && hasCost(c, '==', 4) && canBeDiscoveredByClass(c, currentClass);

export const IncredibleValue: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.IncredibleValue_TOY_046],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			IncredibleValue.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.inputOptions.currentClass),
			input.inputOptions,
		),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			IncredibleValue.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.options.currentClass),
			input.options,
		);
		return { cardType: CardType.MINION, cost: 4, possibleCards };
	},
};
