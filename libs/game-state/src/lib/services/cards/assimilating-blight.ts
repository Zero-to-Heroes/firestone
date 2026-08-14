/* eslint-disable no-mixed-spaces-and-tabs */
// Assimilating Blight (GDB_478): 3 Mana
// "<b>Discover</b> a 3-Cost <b>Deathrattle</b> minion. Summon it with <b>Reborn</b>."

import { CardIds, CardType, GameTag, hasMechanic, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, hasCost, canBeDiscoveredByClass } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard, currentClass?: string) =>
	hasCorrectType(c, CardType.MINION) &&
	hasMechanic(c, GameTag.DEATHRATTLE) &&
	hasCost(c, '==', 3) &&
	canBeDiscoveredByClass(c, currentClass);

export const AssimilatingBlight: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.AssimilatingBlight_GDB_478],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			AssimilatingBlight.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.inputOptions.currentClass),
			input.inputOptions,
		),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			AssimilatingBlight.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.options.currentClass),
			input.options,
		);
		return { cardType: CardType.MINION, mechanics: [GameTag.DEATHRATTLE], cost: 3, possibleCards };
	},
};
