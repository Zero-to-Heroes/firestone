/* eslint-disable no-mixed-spaces-and-tabs */
import { CardClass, CardIds, CardType, hasCorrectTribe, Race } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { canBeDiscoveredByClass, hasCorrectType } from '../../related-cards/dynamic-pools';
import {
	GeneratingCard,
	GuessCardIdInput,
	GuessInfoInput,
	StaticGeneratingCard,
	StaticGeneratingCardInput,
} from './_card.type';
import { filterCards } from './utils';

export const ToysnatchingGeist: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.ToysnatchingGeist_MIS_006, CardIds.ToysnatchingGeist_ToysnatchingGeistToken_MIS_006t],
	publicCreator: true,
	hasSequenceInfo: true,
	guessCardId: (input: GuessCardIdInput): string | null => {
		if (input.createdIndex === 0) {
			return CardIds.ToysnatchingGeist_ToysnatchingGeistToken_MIS_006t;
		}
		return null;
	},
	dynamicPool: (input: StaticGeneratingCardInput) => {
		const currentClass = input.inputOptions.deckState.hero?.classes?.[0]
			? CardClass[input.inputOptions.deckState.hero?.classes?.[0]]
			: '';
		return filterCards(
			ToysnatchingGeist.cardIds[0],
			input.allCards,
			(c) =>
				hasCorrectType(c, CardType.MINION) &&
				hasCorrectTribe(c, Race.UNDEAD) &&
				canBeDiscoveredByClass(c, currentClass),
			input.inputOptions,
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const currentClass = input.deckState.hero?.classes?.[0] ? CardClass[input.deckState.hero?.classes?.[0]] : '';
		if (input.card.createdIndex === 1) {
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
