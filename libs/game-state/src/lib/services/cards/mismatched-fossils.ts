/* eslint-disable no-mixed-spaces-and-tabs */
import { CardClass, CardIds, CardType, GameTag, hasCorrectTribe, Race } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { DeckCard, GuessedInfo } from '../../models/deck-card';
import { DeckState } from '../../models/deck-state';
import { Metadata } from '../../models/metadata';
import { canBeDiscoveredByClass, hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput } from './_card.type';
import { AllCardsService } from '@firestone-hs/reference-data';
import { filterCards } from './utils';

export const MismatchedFossils: GeneratingCard = {
	cardIds: [CardIds.MismatchedFossils_DEEP_001],
	hasSequenceInfo: true,
	publicCreator: true,
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const currentClass = input.deckState.hero?.classes?.[0] ? CardClass[input.deckState.hero?.classes?.[0]] : '';
		if (input.card.createdIndex === 0) {
			return {
				cardType: CardType.MINION,
				races: [Race.BEAST],
				possibleCards: filterCards(
					MismatchedFossils.cardIds[0],
					input.allCards,
					(c) =>
						hasCorrectType(c, CardType.MINION) &&
						hasCorrectTribe(c, Race.BEAST) &&
						canBeDiscoveredByClass(c, currentClass),
					input.options,
				),
			};
		} else if (input.card.createdIndex === 1) {
			return {
				cardType: CardType.MINION,
				races: [Race.UNDEAD],
				possibleCards: filterCards(
					MismatchedFossils.cardIds[0],
					input.allCards,
					(c) =>
						hasCorrectType(c, CardType.MINION) &&
						hasCorrectTribe(c, Race.UNDEAD) &&
						canBeDiscoveredByClass(c, currentClass),
					input.options,
				),
			};
		}
		return null;
	},
};
