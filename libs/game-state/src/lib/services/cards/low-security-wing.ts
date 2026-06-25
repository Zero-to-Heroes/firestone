/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Low Security Wing (JAIL_987)
 * Get a random Shaman minion. It's locked in your hand until you play another card.
 */
import { CardClass, CardIds, CardType, ReferenceCard } from '@firestone-hs/reference-data';

import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectClass, hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const shamanMinionFilter = (c: ReferenceCard) =>
	hasCorrectType(c, CardType.MINION) && hasCorrectClass(c, CardClass.SHAMAN);

export const LowSecurityWing: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.LowSecurityWing_JAIL_987],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			CardIds.LowSecurityWing_JAIL_987,
			input.allCards,
			shamanMinionFilter,
			input.inputOptions,
		),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => ({
		cardType: CardType.MINION,
		cardClasses: [CardClass.SHAMAN],
		possibleCards: filterCards(
			CardIds.LowSecurityWing_JAIL_987,
			input.allCards,
			shamanMinionFilter,
			input.options,
		),
	}),
};
