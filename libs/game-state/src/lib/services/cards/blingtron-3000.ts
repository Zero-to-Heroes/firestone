/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const Blingtron3000: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.Blingtron3000],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			Blingtron3000.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.WEAPON),
			input.inputOptions,
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		return {
			cardType: CardType.WEAPON,
			possibleCards: filterCards(
				Blingtron3000.cardIds[0],
				input.allCards,
				(c) => hasCorrectType(c, CardType.WEAPON),
				input.options,
			),
		};
	},
};
