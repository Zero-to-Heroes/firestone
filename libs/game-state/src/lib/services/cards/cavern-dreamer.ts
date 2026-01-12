/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

// Cavern Dreamer (TOT_308)
// "At the end of your turn, add a random spell that costs (2) or less to your hand."
export const CavernDreamer: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.CavernDreamer],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			CavernDreamer.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.SPELL) && c.cost != null && c.cost <= 2,
			input.inputOptions,
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		return {
			cardType: CardType.SPELL,
			possibleCards: filterCards(
				CavernDreamer.cardIds[0],
				input.allCards,
				(c) => hasCorrectType(c, CardType.SPELL) && c.cost != null && c.cost <= 2,
				input.options,
			),
		};
	},
};
