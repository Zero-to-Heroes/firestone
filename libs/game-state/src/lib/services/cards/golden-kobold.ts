/* eslint-disable no-mixed-spaces-and-tabs */
// Golden Kobold (LOOT_998k): 3 Mana 6/6
// "[x]<b>Taunt</b> <b> Battlecry:</b> Replace your hand with <b>Legendary</b> minions. They cost (1) less."

import { CardIds, CardType, CardRarity, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, hasCorrectRarity } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) => hasCorrectType(c, CardType.MINION) && hasCorrectRarity(c, CardRarity.LEGENDARY);

export const GoldenKobold: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.GoldenKobold],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(GoldenKobold.cardIds[0], input.allCards, isMatch, input.inputOptions),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(GoldenKobold.cardIds[0], input.allCards, isMatch, input.options);
		return { cardType: CardType.MINION, rarity: CardRarity.LEGENDARY, possibleCards };
	},
};
