/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardRarity, CardType, GameTag } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { DeckCard, GuessedInfo } from '../../models/deck-card';
import { DeckState } from '../../models/deck-state';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { AllCardsService } from '@firestone-hs/reference-data';
import { filterCards } from './utils';
import { hasCost } from '../../related-cards/dynamic-pools';

export const WelcomeHome: StaticGeneratingCard = {
	cardIds: [CardIds.WelcomeHome_TIME_EVENT_997],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(WelcomeHome.cardIds[0], input.allCards, (c) => hasCost(c, '==', 3), input.inputOptions);
	},
};
