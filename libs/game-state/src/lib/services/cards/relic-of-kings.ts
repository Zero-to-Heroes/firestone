/* eslint-disable no-mixed-spaces-and-tabs */
// Relic of Kings (TLC_334): 7 Mana
// "<b>Discover</b> a spell from any class that costs (8) or more. It costs (1)."

import { CardIds, CardType, CardClass, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, hasCost } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) =>
	hasCorrectType(c, CardType.SPELL) && hasCost(c, '>=', 8) && !c.classes?.includes(CardClass[CardClass.NEUTRAL]);

export const RelicOfKings: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.RelicOfKings_TLC_334],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(RelicOfKings.cardIds[0], input.allCards, isMatch, input.inputOptions),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(RelicOfKings.cardIds[0], input.allCards, isMatch, input.options);
		return { cardType: CardType.SPELL, possibleCards };
	},
};
