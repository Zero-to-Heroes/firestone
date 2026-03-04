/* eslint-disable no-mixed-spaces-and-tabs */
// Carrier Whelp (CATA_556): 1 Mana 1/2 Dragon
// "Battlecry: Get a random Dragon that costs (3) or less."

import { CardIds, CardType, hasCorrectTribe, Race } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCost, hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const CarrierWhelp: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.CarrierWhelp_CATA_556],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			CarrierWhelp.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.MINION) && hasCorrectTribe(c, Race.DRAGON) && hasCost(c, '<=', 3),
			input.inputOptions,
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			CarrierWhelp.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.MINION) && hasCorrectTribe(c, Race.DRAGON) && hasCost(c, '<=', 3),
			input.options,
		);
		return {
			cardType: CardType.MINION,
			races: [Race.DRAGON],
			possibleCards: possibleCards,
		};
	},
};
