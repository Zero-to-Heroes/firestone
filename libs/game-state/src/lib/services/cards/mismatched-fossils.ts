/* eslint-disable no-mixed-spaces-and-tabs */
import { CardClass, CardIds, CardType, hasCorrectTribe, Race } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { canBeDiscoveredByClass, hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const MismatchedFossils: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.MismatchedFossils_DEEP_001],
	hasSequenceInfo: true,
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			MismatchedFossils.cardIds[0],
			input.allCards,
			(c) =>
				hasCorrectType(c, CardType.MINION) &&
				canBeDiscoveredByClass(c, input.inputOptions.currentClass) &&
				(hasCorrectTribe(c, Race.BEAST) || hasCorrectTribe(c, Race.UNDEAD)),
			input.inputOptions,
		),
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
