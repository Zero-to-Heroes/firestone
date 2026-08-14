/* eslint-disable no-mixed-spaces-and-tabs */
// Crypt Map (TLC_435): 1 Mana
// "<b>Discover</b> a Frost Rune card. If you play it this turn, also pick one of the others."

import { CardIds, DkruneTypes, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { canBeDiscoveredByClass, hasCorrectRune } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard, currentClass?: string) =>
	hasCorrectRune(c, DkruneTypes.FROSTRUNE) && canBeDiscoveredByClass(c, currentClass);

export const CryptMap: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.CryptMap_TLC_435],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			CryptMap.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.inputOptions.currentClass),
			input.inputOptions,
		),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			CryptMap.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.options.currentClass),
			input.options,
		);
		return { possibleCards };
	},
};
