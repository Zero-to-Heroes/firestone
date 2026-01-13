/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType, SetId } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

// Wildlands Adventurer (TOT_056)
// "<b>Battlecry:</b> Add a random card from the Hall of Fame to your hand."
export const WildlandsAdventurer: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.WildlandsAdventurer],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			WildlandsAdventurer.cardIds[0],
			input.allCards,
			(c) => c.set === 'HOF' || c.set === 'Hall_of_fame',
			input.inputOptions,
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		return {
			possibleCards: filterCards(
				WildlandsAdventurer.cardIds[0],
				input.allCards,
				(c) => c.set === 'HOF' || c.set === 'Hall_of_fame',
				input.options,
			),
		};
	},
};
