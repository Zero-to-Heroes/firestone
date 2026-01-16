/* eslint-disable no-mixed-spaces-and-tabs */
// Chromie's Epoch: Escape from Durnholde (TOT_030t3)
// Card text: "Casts When Drawn. Add two random spells to your hand."
// This token is shuffled into deck by Chromie, Bronze Emissary.
import { CardIds, CardType } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const ChromieEscapeFromDurnholde: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.Chromie_EscapeFromDurnholdeToken],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			ChromieEscapeFromDurnholde.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.SPELL),
			input.inputOptions,
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		return {
			cardType: CardType.SPELL,
			possibleCards: filterCards(
				ChromieEscapeFromDurnholde.cardIds[0],
				input.allCards,
				(c) => hasCorrectType(c, CardType.SPELL),
				input.options,
			),
		};
	},
};
