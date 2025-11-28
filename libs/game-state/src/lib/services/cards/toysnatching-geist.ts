/* eslint-disable no-mixed-spaces-and-tabs */
import {
	CardClass,
	CardIds,
	CardType,
	GameTag,
	hasCorrectTribe,
	Race,
	SpellSchool,
} from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { DeckCard, GuessedInfo } from '../../models/deck-card';
import { DeckState } from '../../models/deck-state';
import { GeneratingCard, GuessInfoInput } from './_card.type';
import { AllCardsService } from '@firestone-hs/reference-data';
import { filterCards } from './utils';
import { canBeDiscoveredByClass, hasCorrectType } from '../../related-cards/dynamic-pools';

export const ToysnatchingGeist: GeneratingCard = {
	cardIds: [CardIds.ToysnatchingGeist_MIS_006],
	publicCreator: true,
	guessCardId: (
		cardId: string,
		deckState: DeckState,
		opponentDeckState: DeckState,
		creatorCardId: string,
		creatorEntityId: number,
		createdIndex: number,
		allCards: AllCardsService,
	): string | null => {
		if (createdIndex === 1) {
			return CardIds.ToysnatchingGeist_ToysnatchingGeistToken_MIS_006t;
		}
		return cardId;
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const currentClass = input.deckState.hero?.classes?.[0] ? CardClass[input.deckState.hero?.classes?.[0]] : '';
		if (input.card.createdIndex === 0) {
			return {
				cardType: CardType.MINION,
				races: [Race.UNDEAD],
				possibleCards: filterCards(
					ToysnatchingGeist.cardIds[0],
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
