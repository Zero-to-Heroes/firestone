// Champions of Azeroth (WON_113)
// "Choose Alliance or Horde. Get 2 of their <b>Legendary</b> Champions and reduce their Costs by (2)."
import { AllCardsService, CardIds } from '@firestone-hs/reference-data';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';

const relatedChampionIds = (allCards: AllCardsService, cardId: string): readonly string[] => {
	return allCards
		.getCard(cardId)
		.relatedCardDbfIds?.map((dbfId) => allCards.getCard(dbfId)?.id)
		.filter((id): id is string => !!id) ?? [];
};

export const ChampionsOfAzeroth: GeneratingCard & StaticGeneratingCard = {
	cardIds: [
		CardIds.ChampionsOfAzeroth_WON_113,
		CardIds.ChampionsOfAzeroth_ForTheAlliance_WON_113a,
		CardIds.ChampionsOfAzeroth_ForTheHorde_WON_113b,
	],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return relatedChampionIds(input.allCards, input.cardId);
	},
	guessInfo: (input: GuessInfoInput) => {
		return {
			possibleCards: relatedChampionIds(input.allCards, input.card.cardId),
		};
	},
};
