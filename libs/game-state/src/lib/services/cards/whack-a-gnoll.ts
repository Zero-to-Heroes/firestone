/* eslint-disable no-mixed-spaces-and-tabs */
// Whack-A-Gnoll (MIS_700): 1 Mana
// "<b>Discover</b> a Paladin weapon from the past. Give it +1/+1."

import { CardIds, CardType, CardClass, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, hasCorrectClass } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCardsFromThePast } from './utils';

const isMatch = (c: ReferenceCard) => hasCorrectType(c, CardType.WEAPON) && hasCorrectClass(c, CardClass.PALADIN);

export const WhackAGnoll: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.WhackAGnoll_MIS_700],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCardsFromThePast(WhackAGnoll.cardIds[0], input.allCards, isMatch, input.inputOptions),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCardsFromThePast(WhackAGnoll.cardIds[0], input.allCards, isMatch, input.options);
		return { cardType: CardType.WEAPON, cardClasses: [CardClass.PALADIN], possibleCards };
	},
};
