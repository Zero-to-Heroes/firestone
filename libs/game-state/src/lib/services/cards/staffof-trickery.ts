/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Staffof Trickery (JAIL_875)
 * After your hero attacks, Discover a Druid card. Reduce its Cost by your hero's Attack.
 */
import { CardClass, CardIds } from '@firestone-hs/reference-data';

import { GuessedInfo } from '../../models/deck-card';
import { canBeDiscoveredByClass, hasCorrectClass } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const druidDiscoverFilter = (c: Parameters<typeof hasCorrectClass>[0], currentClass: string | undefined) =>
	hasCorrectClass(c, CardClass.DRUID) && canBeDiscoveredByClass(c, currentClass);

export const StaffofTrickery: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.StaffofTrickery_JAIL_875],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			CardIds.StaffofTrickery_JAIL_875,
			input.allCards,
			(c) => druidDiscoverFilter(c, input.inputOptions.deckState.getCurrentClass()),
			input.inputOptions,
		),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => ({
		cardClasses: [CardClass.DRUID],
		possibleCards: filterCards(
			CardIds.StaffofTrickery_JAIL_875,
			input.allCards,
			(c) => druidDiscoverFilter(c, input.deckState.getCurrentClass()),
			input.options,
		),
	}),
};
