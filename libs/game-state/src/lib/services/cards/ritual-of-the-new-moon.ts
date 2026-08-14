/* eslint-disable no-mixed-spaces-and-tabs */
// Ritual of the New Moon (EDR_461): 5 Mana
// "[x]Summon two random 3-Cost minions. <i>(Cast 3 spells to summon 6-Cost minions instead.)</i>"

import { CardIds, CardType, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, hasCost } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) =>
	hasCorrectType(c, CardType.MINION) && (hasCost(c, '==', 6) || hasCost(c, '==', 3));

export const RitualOfTheNewMoon: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.RitualOfTheNewMoon_EDR_461],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(RitualOfTheNewMoon.cardIds[0], input.allCards, isMatch, input.inputOptions),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(RitualOfTheNewMoon.cardIds[0], input.allCards, isMatch, input.options);
		return { cardType: CardType.MINION, possibleCards };
	},
};
