/* eslint-disable no-mixed-spaces-and-tabs */
// Merithra of the Dream (CATA_140): 8 Mana 4/12 Dragon
// "Battlecry: Fill your hand with random Dragons..."

import { CardIds, CardType, hasCorrectTribe, Race } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const MerithraOfTheDream: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.MerithraOfTheDream_CATA_140],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			MerithraOfTheDream.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.MINION) && hasCorrectTribe(c, Race.DRAGON),
			input.inputOptions,
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			MerithraOfTheDream.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.MINION) && hasCorrectTribe(c, Race.DRAGON),
			input.options,
		);
		return {
			cardType: CardType.MINION,
			races: [Race.DRAGON],
			possibleCards: possibleCards,
		};
	},
};
