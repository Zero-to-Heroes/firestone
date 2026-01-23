// Eudora's Treasure Hunt (VAC_464t)
// "Sidequest: Play 3 cards from other classes. Reward: Discover two amazing pieces of loot!"
// The card can discover any of the related treasure tokens (loot pieces).

import { AllCardsService, CardIds } from '@firestone-hs/reference-data';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';

const relatedTreasureIds = (allCards: AllCardsService, cardId: string): readonly string[] => {
	return (
		allCards
			.getCard(cardId)
			.relatedCardDbfIds?.map((dbfId) => allCards.getCard(dbfId)?.id)
			.filter((id): id is string => !!id) ?? []
	);
};

export const EudorasTreasureHunt: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.TreasureHunterEudora_EudorasTreasureHuntToken_VAC_464t],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return relatedTreasureIds(input.allCards, input.cardId);
	},
	guessInfo: (input: GuessInfoInput) => {
		return {
			possibleCards: relatedTreasureIds(input.allCards, input.card.cardId),
		};
	},
};
