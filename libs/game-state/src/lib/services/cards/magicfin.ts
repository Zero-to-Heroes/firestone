/* eslint-disable no-mixed-spaces-and-tabs */
// Magicfin (DMF_707): 3 Mana 3/4 Shaman Murloc minion
// "After a friendly Murloc dies, add a random <b>Legendary</b> minion to your hand."
// The minion is added to hand (random, not discover), so it needs guessInfo
// Since it's random (not discover), no canBeDiscoveredByClass filter is used

import { CardIds, CardRarity, CardType } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectRarity, hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const Magicfin: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.Magicfin],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			Magicfin.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.MINION) && hasCorrectRarity(c, CardRarity.LEGENDARY),
			input.inputOptions,
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			Magicfin.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.MINION) && hasCorrectRarity(c, CardRarity.LEGENDARY),
			input.options,
		);
		return {
			cardType: CardType.MINION,
			rarity: CardRarity.LEGENDARY,
			possibleCards: possibleCards,
		};
	},
};
