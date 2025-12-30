/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

// The Sunwell (RLK_590)
// "Fill your hand with random spells. Costs (1) less for each other card in your hand."
export const TheSunwell: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.TheSunwell],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			TheSunwell.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.SPELL),
			input.inputOptions,
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		return {
			cardType: CardType.SPELL,
			possibleCards: filterCards(
				TheSunwell.cardIds[0],
				input.allCards,
				(c) => hasCorrectType(c, CardType.SPELL),
				input.options,
			),
		};
	},
};
