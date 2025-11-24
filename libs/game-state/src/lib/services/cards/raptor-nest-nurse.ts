/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType, GameTag } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { DeckCard, GuessedInfo } from '../../models/deck-card';
import { DeckState } from '../../models/deck-state';
import { Metadata } from '../../models/metadata';
import { hasCorrectType, hasCost } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput } from './_card.type';
import { AllCardsService } from '@firestone-hs/reference-data';
import { filterCards } from './utils';

export const RaptorNestNurse: GeneratingCard = {
	cardIds: [CardIds.RaptorNestNurse_DINO_434],
	hasSequenceInfo: true,
	publicCreator: true,
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		if (input.card.createdIndex === 0) {
			return {
				cost: 1,
				cardType: CardType.MINION,
				possibleCards: filterCards(
					RaptorNestNurse.cardIds[0],
					input.allCards,
					(c) => hasCorrectType(c, CardType.MINION) && hasCost(c, '==', 1),
					input.options,
				),
			};
		} else if (input.card.createdIndex === 1) {
			return {
				cost: 1,
				cardType: CardType.SPELL,
				possibleCards: filterCards(
					RaptorNestNurse.cardIds[0],
					input.allCards,
					(c) => hasCorrectType(c, CardType.SPELL) && hasCost(c, '==', 1),
					input.options,
				),
			};
		}
		return null;
	},
};
