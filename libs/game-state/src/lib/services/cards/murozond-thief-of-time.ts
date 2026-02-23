/* eslint-disable no-mixed-spaces-and-tabs */
// Murozond, Thief of Time (WON_066): 7 Mana 6/6 Priest Legendary Dragon minion
// "Battlecry: If your deck has no duplicates, Discover a Dragon. Deal damage equal to its Cost to all other minions."

import { CardIds, CardType, hasCorrectTribe, Race } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { canBeDiscoveredByClass, hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const MurozondThiefOfTime: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.MurozondThiefOfTime_WON_066],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			MurozondThiefOfTime.cardIds[0],
			input.allCards,
			(c) =>
				hasCorrectType(c, CardType.MINION) &&
				hasCorrectTribe(c, Race.DRAGON) &&
				canBeDiscoveredByClass(c, input.inputOptions.deckState.getCurrentClass()),
			input.inputOptions,
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		return {
			cardType: CardType.MINION,
			possibleCards: filterCards(
				MurozondThiefOfTime.cardIds[0],
				input.allCards,
				(c) =>
					hasCorrectType(c, CardType.MINION) &&
					hasCorrectTribe(c, Race.DRAGON) &&
					canBeDiscoveredByClass(c, input.deckState.getCurrentClass()),
				input.options,
			),
		};
	},
};
