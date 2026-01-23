// Eudora's Treasure Hunt (VAC_464t)
// "Sidequest: Play 3 cards from other classes. Reward: Discover two amazing pieces of loot!"
// The card can discover any of the related treasure tokens (loot pieces).

import { CardIds } from '@firestone-hs/reference-data';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';

export const EudorasTreasureHunt: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.TreasureHunterEudora_EudorasTreasureHuntToken_VAC_464t],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return (
			input.allCards
				.getCard(input.cardId)
				.relatedCardDbfIds?.map((dbfId) => input.allCards.getCard(dbfId)?.id)
				.filter((id): id is string => !!id) ?? []
		);
	},
	guessInfo: (input: GuessInfoInput) => {
		const possibleCards =
			input.allCards
				.getCard(input.card.cardId)
				.relatedCardDbfIds?.map((dbfId) => input.allCards.getCard(dbfId)?.id)
				.filter((id): id is string => !!id) ?? [];
		return {
			possibleCards: possibleCards,
		};
	},
};
