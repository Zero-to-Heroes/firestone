/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardRarity, CardType, GameTag } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { DeckCard, GuessedInfo } from '../../models/deck-card';
import { DeckState } from '../../models/deck-state';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { AllCardsService } from '@firestone-hs/reference-data';
import { filterCards } from './utils';
import { hasCorrectClass, hasCorrectRarity, hasCorrectType, hasCost } from '../../related-cards/dynamic-pools';

export const SneedsOldShredder: StaticGeneratingCard = {
	cardIds: [CardIds.SneedsOldShredder_GVG_114, CardIds.SneedsOldShredder_CORE_GVG_114],
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			SneedsOldShredder.cardIds[0],
			input.allCards,
			(c) => hasCorrectRarity(c, CardRarity.LEGENDARY) && hasCorrectType(c, CardType.MINION),
			input.inputOptions,
		);
	},
};
