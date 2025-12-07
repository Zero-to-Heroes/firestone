/* eslint-disable no-mixed-spaces-and-tabs */
import { AllCardsService, CardIds, CardType, GameTag, hasMechanic } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { DeckCard, GuessedInfo } from '../../models/deck-card';
import { DeckState } from '../../models/deck-state';
import { hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const ShallowGravedigger: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.ShallowGravedigger_ICC_702, CardIds.ShallowGravedigger_CORE_ICC_702],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			ShallowGravedigger.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.MINION) && hasMechanic(c, GameTag.DEATHRATTLE),
			input.inputOptions,
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			ShallowGravedigger.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.MINION) && hasMechanic(c, GameTag.DEATHRATTLE),
			input.options,
		);
		return {
			cardType: CardType.MINION,
			possibleCards: possibleCards,
		};
	},
};
