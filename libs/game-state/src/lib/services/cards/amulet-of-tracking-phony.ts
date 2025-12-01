/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardRarity, CardType, GameTag } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { DeckCard, GuessedInfo } from '../../models/deck-card';
import { DeckState } from '../../models/deck-state';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { AllCardsService } from '@firestone-hs/reference-data';
import { filterCards } from './utils';

export const AmuletOfTrackingPhony: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.GriftahTrustedVendor_AmuletOfTrackingToken_VAC_959t05],
	publicCreator: true,
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			AmuletOfTrackingPhony.cardIds[0],
			input.allCards,
			(c) => c.rarity?.toUpperCase() === CardRarity[CardRarity.COMMON],
			input.options,
		);
		return {
			rarity: CardRarity.COMMON,
			possibleCards: possibleCards,
		};
	},
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			AmuletOfTrackingPhony.cardIds[0],
			input.allCards,
			(c) => c.rarity?.toUpperCase() === CardRarity[CardRarity.COMMON],
			input.inputOptions,
		);
	},
};
