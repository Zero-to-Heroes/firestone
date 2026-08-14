/* eslint-disable no-mixed-spaces-and-tabs */
// Golden Kobold (VAC_702t4): 3 Mana 6/6
// "[x]<b>Taunt</b> <b> Battlecry:</b> Replace your hand with <b>Legendary</b> minions. They cost (1) less."

import { CardIds, CardType, CardRarity, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, hasCorrectRarity } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) => hasCorrectType(c, CardType.MINION) && hasCorrectRarity(c, CardRarity.LEGENDARY);

export const GoldenKoboldToken: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.MarinTheManager_GoldenKoboldToken_VAC_702t4],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(GoldenKoboldToken.cardIds[0], input.allCards, isMatch, input.inputOptions),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(GoldenKoboldToken.cardIds[0], input.allCards, isMatch, input.options);
		return { cardType: CardType.MINION, rarity: CardRarity.LEGENDARY, possibleCards };
	},
};
