/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardRarity, CardType, GameTag } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { DeckCard, GuessedInfo } from '../../models/deck-card';
import { DeckState } from '../../models/deck-state';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { AllCardsService } from '@firestone-hs/reference-data';
import { filterCards } from './utils';
import { hasCorrectType, hasCost } from '../../related-cards/dynamic-pools';

export const YoggInTheBox: StaticGeneratingCard = {
	cardIds: [CardIds.YoggInTheBox_TOY_372],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		const deckHasMinions = !!input.inputOptions.deckState?.deck?.some(
			(c) =>
				input.allCards.getCard(c.cardId).type?.toUpperCase() === CardType[CardType.MINION] ||
				c.getCardType() === CardType.MINION,
		);
		return filterCards(
			YoggInTheBox.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.SPELL) && hasCost(c, '>=', !deckHasMinions ? 5 : 0),
			input.inputOptions,
		);
	},
};
