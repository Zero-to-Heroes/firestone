/* eslint-disable no-mixed-spaces-and-tabs */
import { AllCardsService, CardIds, CardType } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';

// Build Taverns of Time pool directly from card data to bypass format validity filtering.
// This includes all collectible cards from the set (excluding enchantments).
const buildTavernsOfTimePool = (allCards: AllCardsService): readonly string[] => {
	return allCards
		.getCards()
		.filter(
			(c) =>
				c.set?.toLowerCase() === 'taverns_of_time' &&
				c.type?.toUpperCase() !== CardType[CardType.ENCHANTMENT] &&
				!!c.id &&
				!/t\d*$/.test(c.id)
		)
		.sort((a, b) => (a.cost ?? 0) - (b.cost ?? 0) || a.name.localeCompare(b.name))
		.map((c) => c.id) as readonly string[];
};

// Wildlands Adventurer (TOT_056)
// "<b>Rewind</b> <b>Battlecry:</b> Get a random card from The Taverns of Time."
export const WildlandsAdventurer: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.WildlandsAdventurer],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return buildTavernsOfTimePool(input.allCards);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		return {
			possibleCards: buildTavernsOfTimePool(input.allCards),
		};
	},
};
