/* eslint-disable no-mixed-spaces-and-tabs */
// Chromie's Epoch: Escape from Durnholde (TOT_030t3)
// Card text: "Casts When Drawn. Add two random spells to your hand."
// This token is shuffled into deck by Chromie, Bronze Emissary.
// The dynamic pool contains the related cards that can be discovered.
import { CardIds } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';

export const ChromieEscapeFromDurnholde: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.Chromie_EscapeFromDurnholdeToken],
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
