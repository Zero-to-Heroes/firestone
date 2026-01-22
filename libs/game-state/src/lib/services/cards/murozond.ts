import { AllCardsService, CardIds, CardType, GameTag, hasMechanic } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';

// Builds the complete pool of cards that Murozond can give, including:
// - Collectible Fabled/Fabled+ minions
// - Their bundled cards (tokens that can be spells, weapons, minions, etc.)
const buildFabledPackagePool = (allCards: AllCardsService): readonly string[] => {
	return allCards
		.getCards()
		.filter(
			(c) =>
				// Collectible Fabled/Fabled+ minions
				(c.collectible &&
					hasCorrectType(c, CardType.MINION) &&
					(hasMechanic(c, GameTag.FABLED) || hasMechanic(c, GameTag.FABLED_PLUS))) ||
				// Bundled cards (tokens) that come with Fabled minions
				hasMechanic(c, GameTag.IS_FABLED_BUNDLE_CARD),
		)
		.sort((a, b) => (a.cost ?? 0) - (b.cost ?? 0) || a.name.localeCompare(b.name))
		.map((c) => c.id) as readonly string[];
};

// Murozond (TOT_332)
// "<b>Rewind</b> <b>Battlecry:</b> Get a random <b>Fabled</b> minion and its bundled cards."
export const Murozond: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.Murozond_TOT_332],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return buildFabledPackagePool(input.allCards);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		return {
			// No cardType specified since Murozond can generate different types:
			// the Fabled minion itself + bundled cards (which can be spells, weapons, etc.)
			possibleCards: buildFabledPackagePool(input.allCards),
		};
	},
};
