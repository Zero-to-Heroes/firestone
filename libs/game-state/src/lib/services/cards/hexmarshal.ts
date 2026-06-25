/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Hexmarshal (JAIL_806)
 * Battlecry: Get a random spell that costs (5) or more. If your deck started with no spells, it costs (5) less.
 */
import { CardIds, CardType, ReferenceCard } from '@firestone-hs/reference-data';

import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, hasCost } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const spellFilter = (c: ReferenceCard) => hasCorrectType(c, CardType.SPELL) && hasCost(c, '>=', 5);

export const Hexmarshal: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.Hexmarshal_JAIL_806],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			CardIds.Hexmarshal_JAIL_806,
			input.allCards,
			spellFilter,
			input.inputOptions,
		),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => ({
		cardType: CardType.SPELL,
		cost: { cost: 5, comparison: '>=' },
		possibleCards: filterCards(
			CardIds.Hexmarshal_JAIL_806,
			input.allCards,
			spellFilter,
			input.options,
		),
	}),
};
