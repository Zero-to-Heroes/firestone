/* eslint-disable no-mixed-spaces-and-tabs */
// Chromie's Epoch: Opening the Dark Portal (TOT_030t1)
// Card text: "Casts When Drawn. Add two random Legendary minions to your hand."
// This token is shuffled into deck by Chromie, Bronze Emissary.
import { CardIds, CardRarity, CardType } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectRarity, hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const ChromieOpeningTheDarkPortal: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.Chromie_OpeningTheDarkPortalToken],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			ChromieOpeningTheDarkPortal.cardIds[0],
			input.allCards,
			(c) => hasCorrectRarity(c, CardRarity.LEGENDARY) && hasCorrectType(c, CardType.MINION),
			input.inputOptions,
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		return {
			cardType: CardType.MINION,
			possibleCards: filterCards(
				ChromieOpeningTheDarkPortal.cardIds[0],
				input.allCards,
				(c) => hasCorrectRarity(c, CardRarity.LEGENDARY) && hasCorrectType(c, CardType.MINION),
				input.options,
			),
		};
	},
};
