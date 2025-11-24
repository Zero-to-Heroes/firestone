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

export const RazaTheResealed: GeneratingCard = {
	cardIds: [CardIds.RazaTheResealed_TOY_383],
	hasSequenceInfo: true,
	publicCreator: true,
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = input.deckState.minionsDeadThisMatch
			.map((e) => e.cardId)
			.filter((value, index, self) => self.indexOf(value) === index);
		return {
			possibleCards: possibleCards,
		};
	},
};
