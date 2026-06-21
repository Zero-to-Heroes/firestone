/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Concealing Confection (JAIL_460)
 * Deathrattle: Get a random weapon.
 */
import { CardIds, CardType, ReferenceCard } from '@firestone-hs/reference-data';
import { TempCardIds } from '@firestone/shared/framework/core';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const weaponFilter = (c: ReferenceCard) => hasCorrectType(c, CardType.WEAPON);

export const ConcealingConfection: GeneratingCard & StaticGeneratingCard = {
	cardIds: [TempCardIds.ConcealingConfection_JAIL_460 as unknown as CardIds],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			TempCardIds.ConcealingConfection_JAIL_460 as unknown as CardIds,
			input.allCards,
			weaponFilter,
			input.inputOptions,
		),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => ({
		cardType: CardType.WEAPON,
		possibleCards: filterCards(
			TempCardIds.ConcealingConfection_JAIL_460 as unknown as CardIds,
			input.allCards,
			weaponFilter,
			input.options,
		),
	}),
};
