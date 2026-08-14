/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType, hasCorrectTribe, Race } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { fromAnotherClass, hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const FoolsGold: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.FoolsGold_DEEP_022],
	hasSequenceInfo: true,
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			FoolsGold.cardIds[0],
			input.allCards,
			(c) =>
				hasCorrectType(c, CardType.MINION) &&
				(hasCorrectTribe(c, Race.PIRATE) || hasCorrectTribe(c, Race.ELEMENTAL)) &&
				fromAnotherClass(c, input.inputOptions.currentClass),
			input.inputOptions,
		),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		if (input.card.createdIndex === 0) {
			return {
				cardType: CardType.MINION,
				races: [Race.PIRATE],
				possibleCards: filterCards(
					FoolsGold.cardIds[0],
					input.allCards,
					(c) => hasCorrectType(c, CardType.MINION) && hasCorrectTribe(c, Race.PIRATE),
					input.options,
				),
			};
		} else if (input.card.createdIndex === 1) {
			return {
				cardType: CardType.MINION,
				races: [Race.ELEMENTAL],
				possibleCards: filterCards(
					FoolsGold.cardIds[0],
					input.allCards,
					(c) => hasCorrectType(c, CardType.MINION) && hasCorrectTribe(c, Race.ELEMENTAL),
					input.options,
				),
			};
		}
		return null;
	},
};
