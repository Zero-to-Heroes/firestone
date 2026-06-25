/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * A Dashof That (JAIL_201b)
 * Get a random Druid card.
 */
import { CardClass, CardIds } from '@firestone-hs/reference-data';

import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectClass } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const druidCardFilter = (c: Parameters<typeof hasCorrectClass>[0]) => hasCorrectClass(c, CardClass.DRUID);

export const ADashofThat: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.ADashofThat_JAIL_201b],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			CardIds.ADashofThat_JAIL_201b,
			input.allCards,
			druidCardFilter,
			input.inputOptions,
		),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => ({
		cardClasses: [CardClass.DRUID],
		possibleCards: filterCards(
			CardIds.ADashofThat_JAIL_201b,
			input.allCards,
			druidCardFilter,
			input.options,
		),
	}),
};
