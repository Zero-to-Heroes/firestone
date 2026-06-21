/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Secret Ingredient (JAIL_201)
 * Choose One - Give your hero +2 Attack this turn; or get a random Druid card.
 */
import { CardClass, CardIds } from '@firestone-hs/reference-data';
import { TempCardIds } from '@firestone/shared/framework/core';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectClass } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const druidCardFilter = (c: Parameters<typeof hasCorrectClass>[0]) => hasCorrectClass(c, CardClass.DRUID);

export const SecretIngredient: GeneratingCard & StaticGeneratingCard = {
	cardIds: [TempCardIds.SecretIngredient_JAIL_201 as unknown as CardIds],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			TempCardIds.ADashofThat_JAIL_201b as unknown as CardIds,
			input.allCards,
			druidCardFilter,
			input.inputOptions,
		),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => ({
		cardClasses: [CardClass.DRUID],
		possibleCards: filterCards(
			TempCardIds.ADashofThat_JAIL_201b as unknown as CardIds,
			input.allCards,
			druidCardFilter,
			input.options,
		),
	}),
};
