/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

// Wildlands Adventurer (TOT_056)
// "<b>Rewind</b> <b>Battlecry:</b> Get a random card from The Taverns of Time."
export const WildlandsAdventurer: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.WildlandsAdventurer],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		const tavernsOfTimeCards = input.allCards
			.getCards()
			.filter(
				(c) =>
					c.set?.toLowerCase() === 'taverns_of_time' &&
					c.type?.toUpperCase() !== CardType[CardType.ENCHANTMENT] &&
					!!c.id,
			)
			.map((c) => c.id) as readonly string[];
		return [...new Set(tavernsOfTimeCards)];
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		return {
			possibleCards: [
				...new Set(
					input.allCards
						.getCards()
						.filter(
							(c) =>
								c.set?.toLowerCase() === 'taverns_of_time' &&
								c.type?.toUpperCase() !== CardType[CardType.ENCHANTMENT] &&
								!!c.id,
						)
						.map((c) => c.id) as readonly string[],
				),
			],
		};
	},
};
