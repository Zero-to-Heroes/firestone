/* eslint-disable no-mixed-spaces-and-tabs */
import { AllCardsService, CardIds, CardType, hasCorrectTribe, Race } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { DeckCard, GuessedInfo } from '../../models/deck-card';
import { DeckState } from '../../models/deck-state';
import { hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const EarthenMight: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.EarthenMight],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			EarthenMight.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.MINION) && hasCorrectTribe(c, Race.ELEMENTAL),
			input.inputOptions,
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			EarthenMight.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.MINION) && hasCorrectTribe(c, Race.ELEMENTAL),
			input.options,
		);
		return {
			cardType: CardType.MINION,
			races: [Race.ELEMENTAL],
			possibleCards: possibleCards,
		};
	},
};
