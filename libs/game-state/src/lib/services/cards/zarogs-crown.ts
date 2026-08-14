/* eslint-disable no-mixed-spaces-and-tabs */
// Zarog's Crown (LOOT_998j): 3 Mana
// "<b>Discover</b> a <b>Legendary</b> minion. Summon two copies of it."

import { CardIds, CardType, CardRarity, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, canBeDiscoveredByClass, hasCorrectRarity } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard, currentClass?: string) =>
	hasCorrectType(c, CardType.MINION) &&
	hasCorrectRarity(c, CardRarity.LEGENDARY) &&
	canBeDiscoveredByClass(c, currentClass);

export const ZarogsCrown: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.ZarogsCrown],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			ZarogsCrown.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.inputOptions.currentClass),
			input.inputOptions,
		),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			ZarogsCrown.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.options.currentClass),
			input.options,
		);
		return { cardType: CardType.MINION, rarity: CardRarity.LEGENDARY, possibleCards };
	},
};
