/* eslint-disable no-mixed-spaces-and-tabs */
// Announce Darkness (VAC_941): 1 Mana
// "Replace your Hero Power and non-Warlock cards with Warlock ones. They cost (1) less."

import { CardIds, CardClass, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectClass } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) => hasCorrectClass(c, CardClass.WARLOCK);

export const AnnounceDarkness: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.AnnounceDarkness_VAC_941],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(AnnounceDarkness.cardIds[0], input.allCards, isMatch, input.inputOptions),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(AnnounceDarkness.cardIds[0], input.allCards, isMatch, input.options);
		return { cardClasses: [CardClass.WARLOCK], possibleCards };
	},
};
