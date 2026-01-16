/* eslint-disable no-mixed-spaces-and-tabs */
// Chromie's Epoch: Opening the Dark Portal (TOT_030t1)
// Card text: "Casts When Drawn. Add two random Legendary minions to your hand."
// This token is shuffled into deck by Chromie, Bronze Emissary.
// The dynamic pool contains the related cards that can be discovered.
import { CardIds } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';

export const ChromieOpeningTheDarkPortal: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.Chromie_OpeningTheDarkPortalToken],
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
