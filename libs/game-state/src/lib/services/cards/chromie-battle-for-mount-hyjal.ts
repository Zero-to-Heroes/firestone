/* eslint-disable no-mixed-spaces-and-tabs */
// Chromie's Epoch: Battle for Mount Hyjal (TOT_030t2)
// Card text: "Casts When Drawn. Give your minions +2/+2."
// This token is shuffled into deck by Chromie, Bronze Emissary.
// The dynamic pool contains the related cards that can be discovered.
import { CardIds } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';

export const ChromieBattleForMountHyjal: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.Chromie_BattleForMountHyjalToken],
	publicCreator: true,
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = input.allCards
			.getCard(input.card.cardId)
			.relatedCardDbfIds?.map((dbfId) => input.allCards.getCard(dbfId).id);
		return {
			possibleCards: possibleCards,
		};
	},
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return (
			input.allCards.getCard(input.cardId).relatedCardDbfIds?.map((dbfId) => input.allCards.getCard(dbfId).id) ??
			[]
		);
	},
};
