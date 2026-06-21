/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Hexmarshal (JAIL_806)
 * Battlecry: Get a random spell that costs (5) or more. If your deck started with no spells, it costs (5) less.
 */
import { CardIds, CardType, ReferenceCard } from '@firestone-hs/reference-data';
import { TempCardIds } from '@firestone/shared/framework/core';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, hasCost } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const spellFilter = (c: ReferenceCard) => hasCorrectType(c, CardType.SPELL) && hasCost(c, '>=', 5);

export const Hexmarshal: GeneratingCard & StaticGeneratingCard = {
	cardIds: [TempCardIds.Hexmarshal_JAIL_806 as unknown as CardIds],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			TempCardIds.Hexmarshal_JAIL_806 as unknown as CardIds,
			input.allCards,
			spellFilter,
			input.inputOptions,
		),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => ({
		cardType: CardType.SPELL,
		cost: { cost: 5, comparison: '>=' },
		possibleCards: filterCards(
			TempCardIds.Hexmarshal_JAIL_806 as unknown as CardIds,
			input.allCards,
			spellFilter,
			input.options,
		),
	}),
};
