/* eslint-disable no-mixed-spaces-and-tabs */
import { CardClass, CardIds, CardType, hasCorrectTribe, Race } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { canBeDiscoveredByClass, hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessCardIdInput, GuessInfoInput } from './_card.type';
import { filterCards } from './utils';

export const ToysnatchingGeist: GeneratingCard = {
	cardIds: [CardIds.ToysnatchingGeist_MIS_006],
	publicCreator: true,
	hasSequenceInfo: true,
	guessCardId: (input: GuessCardIdInput): string | null => {
		if (input.createdIndex === 0) {
			return CardIds.ToysnatchingGeist_ToysnatchingGeistToken_MIS_006t;
		}
		return null;
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
