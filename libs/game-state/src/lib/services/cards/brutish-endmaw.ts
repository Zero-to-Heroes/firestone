/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType } from '@firestone-hs/reference-data';
import { TempCardIds } from '@firestone/shared/common/service';
import { canBeDiscoveredByClass, hasCorrectType, hasCost } from '../../..';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const BrutishEndmaw: StaticGeneratingCard & GeneratingCard = {
	cardIds: [TempCardIds.BrutishEndmaw as unknown as CardIds],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		const possibleCards = filterCards(
			BrutishEndmaw.cardIds[0],
			input.allCards,
			(c) =>
				hasCost(c, '==', 1) &&
				hasCorrectType(c, CardType.MINION) &&
				canBeDiscoveredByClass(c, input.inputOptions.deckState.getCurrentClass()),
			input.inputOptions,
		);
		return possibleCards;
	},
	guessInfo: (input: GuessInfoInput) => {
		return {
			cardType: CardType.MINION,
			cost: { cost: 1, comparison: '==' },
			possibleCards: filterCards(
				BrutishEndmaw.cardIds[0],
				input.allCards,
				(c) =>
					hasCost(c, '==', 1) &&
					hasCorrectType(c, CardType.MINION) &&
					canBeDiscoveredByClass(c, input.deckState.getCurrentClass()),
				input.options,
			),
		};
	},
};
