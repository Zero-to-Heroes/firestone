/* eslint-disable no-mixed-spaces-and-tabs */
// Chalk Artist (TOY_388): 4 Mana 4/3
// "[x]<b>Battlecry:</b> Draw a minion. Transform it into a random <b>Legendary</b> one <i>(keeping its original stats and Cost)</i>."

import { CardIds, CardType, CardRarity, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, hasCorrectRarity } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) => hasCorrectType(c, CardType.MINION) && hasCorrectRarity(c, CardRarity.LEGENDARY);

export const ChalkArtist: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.ChalkArtist_TOY_388],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(ChalkArtist.cardIds[0], input.allCards, isMatch, input.inputOptions),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(ChalkArtist.cardIds[0], input.allCards, isMatch, input.options);
		return { cardType: CardType.MINION, rarity: CardRarity.LEGENDARY, possibleCards };
	},
};
