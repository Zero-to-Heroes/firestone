/* eslint-disable no-mixed-spaces-and-tabs */
// Suspicious Usher (CORE_REV_002): 1 Mana 1/3
// "[x]<b>Battlecry:</b> <b>Discover</b> a <b>Legendary</b> minion. If your opponent guesses your choice, they get a copy."

import { CardIds, CardType, CardRarity, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, canBeDiscoveredByClass, hasCorrectRarity } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard, currentClass?: string) =>
	hasCorrectType(c, CardType.MINION) &&
	hasCorrectRarity(c, CardRarity.LEGENDARY) &&
	canBeDiscoveredByClass(c, currentClass);

export const SuspiciousUsher: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.SuspiciousUsher_CORE_REV_002],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			SuspiciousUsher.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.inputOptions.currentClass),
			input.inputOptions,
		),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			SuspiciousUsher.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.options.currentClass),
			input.options,
		);
		return { cardType: CardType.MINION, rarity: CardRarity.LEGENDARY, possibleCards };
	},
};
