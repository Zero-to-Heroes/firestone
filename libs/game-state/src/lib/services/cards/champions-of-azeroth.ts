/* eslint-disable no-mixed-spaces-and-tabs */
// Champions of Azeroth (WON_113)
// "Choose Alliance or Horde. Get 2 of their <b>Legendary</b> Champions and reduce their Costs by (2)."
import { CardIds } from '@firestone-hs/reference-data';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';

export const ChampionsOfAzeroth: GeneratingCard & StaticGeneratingCard = {
	cardIds: [
		CardIds.ChampionsOfAzeroth_WON_113,
		CardIds.ChampionsOfAzeroth_ForTheAlliance_WON_113a,
		CardIds.ChampionsOfAzeroth_ForTheHorde_WON_113b,
	],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return (
			input.allCards.getCard(input.cardId).relatedCardDbfIds?.map((dbfId) => input.allCards.getCard(dbfId).id) ??
			[]
		);
	},
	guessInfo: (input: GuessInfoInput) => {
		return {
			possibleCards:
				input.allCards.getCard(input.card.cardId).relatedCardDbfIds?.map((dbfId) => input.allCards.getCard(dbfId).id) ??
				[],
		};
	},
};
