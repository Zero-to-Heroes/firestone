/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Low Security Wing (JAIL_987)
 * Get a random Shaman minion. It's locked in your hand until you play another card.
 */
import { CardClass, CardIds, CardType, ReferenceCard } from '@firestone-hs/reference-data';
import { TempCardIds } from '@firestone/shared/framework/core';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectClass, hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const shamanMinionFilter = (c: ReferenceCard) =>
	hasCorrectType(c, CardType.MINION) && hasCorrectClass(c, CardClass.SHAMAN);

export const LowSecurityWing: GeneratingCard & StaticGeneratingCard = {
	cardIds: [TempCardIds.LowSecurityWing_JAIL_987 as unknown as CardIds],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			TempCardIds.LowSecurityWing_JAIL_987 as unknown as CardIds,
			input.allCards,
			shamanMinionFilter,
			input.inputOptions,
		),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => ({
		cardType: CardType.MINION,
		cardClasses: [CardClass.SHAMAN],
		possibleCards: filterCards(
			TempCardIds.LowSecurityWing_JAIL_987 as unknown as CardIds,
			input.allCards,
			shamanMinionFilter,
			input.options,
		),
	}),
};
