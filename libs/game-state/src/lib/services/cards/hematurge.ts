/* eslint-disable no-mixed-spaces-and-tabs */
// Hematurge (CORE_RLK_066 / RLK_066): 2 Mana 2/3
// "<b>Battlecry:</b> Spend a <b>Corpse</b> to <b>Discover</b> a Blood Rune card."

import { CardIds, DkruneTypes, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectRune } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) => hasCorrectRune(c, DkruneTypes.BLOODRUNE);

export const Hematurge: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.Hematurge_CORE_RLK_066, CardIds.Hematurge_RLK_066],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(Hematurge.cardIds[0], input.allCards, isMatch, input.inputOptions),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(Hematurge.cardIds[0], input.allCards, isMatch, input.options);
		return { possibleCards };
	},
};
