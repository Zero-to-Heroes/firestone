/* eslint-disable no-mixed-spaces-and-tabs */
// Delayed Product (MIS_305): 4 Mana
// "<b>Discover</b> and summon a minion that costs (8) or more. It goes <b>Dormant</b> for 2 turns."

import { CardIds, CardType, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, hasCost, canBeDiscoveredByClass } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard, currentClass?: string) =>
	hasCorrectType(c, CardType.MINION) && hasCost(c, '>=', 8) && canBeDiscoveredByClass(c, currentClass);

export const DelayedProduct: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.DelayedProduct_MIS_305],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			DelayedProduct.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.inputOptions.currentClass),
			input.inputOptions,
		),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			DelayedProduct.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.options.currentClass),
			input.options,
		);
		return { cardType: CardType.MINION, possibleCards };
	},
};
