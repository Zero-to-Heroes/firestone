/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Staffof Trickery (JAIL_875)
 * After your hero attacks, Discover a Druid card. Reduce its Cost by your hero's Attack.
 */
import { CardClass, CardIds } from '@firestone-hs/reference-data';

import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectClass } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const StaffofTrickery: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.StaffofTrickery_JAIL_875],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			CardIds.StaffofTrickery_JAIL_875,
			input.allCards,
			(c) => hasCorrectClass(c, CardClass.DRUID),
			input.inputOptions,
		),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => ({
		cardClasses: [CardClass.DRUID],
		possibleCards: filterCards(
			CardIds.StaffofTrickery_JAIL_875,
			input.allCards,
			(c) => hasCorrectClass(c, CardClass.DRUID),
			input.options,
		),
	}),
};
