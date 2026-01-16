/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType, GameTag, hasMechanic } from '@firestone-hs/reference-data';
import { TempCardIds } from '@firestone/shared/common/service';
import { hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const TrienniumRex: StaticGeneratingCard & GeneratingCard = {
	cardIds: [CardIds.TrienniumRex_END_015],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		const possibleCards = filterCards(
			TrienniumRex.cardIds[0],
			input.allCards,
			(c) => hasMechanic(c, GameTag.DEATHRATTLE) && hasCorrectType(c, CardType.MINION),
			input.inputOptions,
		);
		return possibleCards;
	},
	guessInfo: (input: GuessInfoInput) => {
		return {
			mechanics: [GameTag.DEATHRATTLE],
			cardType: CardType.MINION,
			possibleCards: filterCards(
				TrienniumRex.cardIds[0],
				input.allCards,
				(c) => hasMechanic(c, GameTag.DEATHRATTLE) && hasCorrectType(c, CardType.MINION),
				input.options,
			),
		};
	},
};
