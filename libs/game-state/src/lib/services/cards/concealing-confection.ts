/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Concealing Confection (JAIL_460)
 * Deathrattle: Get a random weapon.
 */
import { CardIds, CardType, ReferenceCard } from '@firestone-hs/reference-data';

import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const weaponFilter = (c: ReferenceCard) => hasCorrectType(c, CardType.WEAPON);

export const ConcealingConfection: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.ConcealingConfection_JAIL_460],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			CardIds.ConcealingConfection_JAIL_460,
			input.allCards,
			weaponFilter,
			input.inputOptions,
		),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => ({
		cardType: CardType.WEAPON,
		possibleCards: filterCards(
			CardIds.ConcealingConfection_JAIL_460,
			input.allCards,
			weaponFilter,
			input.options,
		),
	}),
};
