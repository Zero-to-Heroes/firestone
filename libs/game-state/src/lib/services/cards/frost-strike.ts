/* eslint-disable no-mixed-spaces-and-tabs */
// Frost Strike (RLK_Prologue_025 / RLK_025): 2 Mana
// "[x]Deal $3 damage to a minion. If it dies, <b>Discover</b> a Frost Rune card."

import { CardIds, DkruneTypes, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectRune } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) => hasCorrectRune(c, DkruneTypes.FROSTRUNE);

export const FrostStrike: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.FrostStrike, CardIds.FrostStrikeCore],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(FrostStrike.cardIds[0], input.allCards, isMatch, input.inputOptions),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(FrostStrike.cardIds[0], input.allCards, isMatch, input.options);
		return { possibleCards };
	},
};
