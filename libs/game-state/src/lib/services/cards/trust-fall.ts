/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { canBeDiscoveredByClass, hasCorrectType, hasCost } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const TrustFall: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.TrustFall_WORK_001],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		const currentClass = input.inputOptions.deckState.getCurrentClass();
		return filterCards(
			TrustFall.cardIds[0],
			input.allCards,
			(c) =>
				hasCorrectType(c, CardType.MINION) &&
				hasCost(c, '<=', 5) &&
				canBeDiscoveredByClass(c, currentClass),
			input.inputOptions,
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const currentClass = input.deckState.getCurrentClass();
		return {
			cardType: CardType.MINION,
			cost: { cost: 5, comparison: '<=' },
			possibleCards: filterCards(
				TrustFall.cardIds[0],
				input.allCards,
				(c) =>
					hasCorrectType(c, CardType.MINION) &&
					hasCost(c, '<=', 5) &&
					canBeDiscoveredByClass(c, currentClass),
				input.options,
			),
		};
	},
};
