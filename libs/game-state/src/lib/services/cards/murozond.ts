import { AllCardsService, CardIds, CardType, GameTag, hasMechanic } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';

// Build Fabled minion pool directly from card data to bypass the standard filter
// which excludes Fabled cards from the general pool
const buildFabledMinionPool = (allCards: AllCardsService): readonly string[] => {
	return allCards
		.getCards()
		.filter(
			(c) =>
				c.collectible &&
				hasCorrectType(c, CardType.MINION) &&
				(hasMechanic(c, GameTag.FABLED) || hasMechanic(c, GameTag.FABLED_PLUS)),
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
		return buildFabledMinionPool(input.allCards);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		return {
			cardType: CardType.MINION,
			possibleCards: buildFabledMinionPool(input.allCards),
		};
	},
};
