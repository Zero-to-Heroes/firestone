/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, SetId } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

// Wildlands Adventurer (TOT_056)
// "<b>Rewind</b> <b>Battlecry:</b> Get a random card from The Taverns of Time."
export const WildlandsAdventurer: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.WildlandsAdventurer],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			WildlandsAdventurer.cardIds[0],
			input.allCards,
			(c) => c.set?.toLowerCase() === 'taverns_of_time',
			input.inputOptions,
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		return {
			possibleCards: filterCards(
				WildlandsAdventurer.cardIds[0],
				input.allCards,
				(c) => c.set?.toLowerCase() === 'taverns_of_time',
				input.options,
			),
		};
	},
};
