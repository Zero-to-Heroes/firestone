/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType, hasCorrectTribe, Race } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const NaturalTalent: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.NaturalTalent_VAC_329],
	hasSequenceInfo: true,
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return [
			...filterCards(input.cardId, input.allCards, (c) => hasCorrectTribe(c, Race.NAGA), input.inputOptions),
			...filterCards(input.cardId, input.allCards, (c) => hasCorrectType(c, CardType.SPELL), input.inputOptions),
		];
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		if (input.card.createdIndex === 0) {
			return {
				cardType: CardType.MINION,
				races: [Race.NAGA],
				possibleCards: filterCards(
					NaturalTalent.cardIds[0],
					input.allCards,
					(c) => hasCorrectType(c, CardType.MINION) && hasCorrectTribe(c, Race.NAGA),
					input.options,
				),
			};
		} else if (input.card.createdIndex === 1) {
			return {
				cardType: CardType.SPELL,
				possibleCards: filterCards(
					NaturalTalent.cardIds[0],
					input.allCards,
					(c) => hasCorrectType(c, CardType.SPELL),
					input.options,
				),
			};
		}
		return null;
	},
};
