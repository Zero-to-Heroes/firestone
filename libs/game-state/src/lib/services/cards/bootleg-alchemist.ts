/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Bootleg Alchemist (JAIL_313)
 * Battlecry: Choose a card in your hand. Transform it into a spell that costs (5) more (keeps its original Cost).
 */
import { CardIds, CardType } from '@firestone-hs/reference-data';

import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, hasCost } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const BootlegAlchemist: StaticGeneratingCard & GeneratingCard = {
	cardIds: [CardIds.BootlegAlchemist_JAIL_313],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			CardIds.BootlegAlchemist_JAIL_313,
			input.allCards,
			(c) => hasCorrectType(c, CardType.SPELL) && hasCost(c, '>=', 5),
			input.inputOptions,
		),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => ({
		cardType: CardType.SPELL,
		cost: { cost: 5, comparison: '>=' },
		possibleCards: filterCards(
			CardIds.BootlegAlchemist_JAIL_313,
			input.allCards,
			(c) => hasCorrectType(c, CardType.SPELL) && hasCost(c, '>=', 5),
			input.options,
		),
	}),
};
