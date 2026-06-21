/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Thiefs Tools (JAIL_706)
 * Get two random 4-Cost spells. Reduce their Costs by (2).
 */
import { CardIds, CardType, ReferenceCard } from '@firestone-hs/reference-data';
import { TempCardIds } from '@firestone/shared/framework/core';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, hasCost } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const spellFilter = (c: ReferenceCard) => hasCorrectType(c, CardType.SPELL) && hasCost(c, '==', 4);

export const ThiefsTools: GeneratingCard & StaticGeneratingCard = {
	cardIds: [TempCardIds.ThiefsTools_JAIL_706 as unknown as CardIds],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			TempCardIds.ThiefsTools_JAIL_706 as unknown as CardIds,
			input.allCards,
			spellFilter,
			input.inputOptions,
		),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => ({
		cardType: CardType.SPELL,
		cost: { cost: 4, comparison: '==' },
		possibleCards: filterCards(
			TempCardIds.ThiefsTools_JAIL_706 as unknown as CardIds,
			input.allCards,
			spellFilter,
			input.options,
		),
	}),
};
