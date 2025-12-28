/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { canBeDiscoveredByClass, hasCorrectType, hasCost } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const RazzleDazzler: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.RazzleDazzler_VAC_301],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		const cost1Minions = filterCards(
			RazzleDazzler.cardIds[0],
			input.allCards,
			(c) =>
				hasCorrectType(c, CardType.MINION) &&
				hasCost(c, '==', 1) &&
				canBeDiscoveredByClass(c, input.inputOptions.currentClass),
			input.inputOptions,
		);
		const cost2Minions = filterCards(
			RazzleDazzler.cardIds[0],
			input.allCards,
			(c) =>
				hasCorrectType(c, CardType.MINION) &&
				hasCost(c, '==', 2) &&
				canBeDiscoveredByClass(c, input.inputOptions.currentClass),
			input.inputOptions,
		);
		const cost3Minions = filterCards(
			RazzleDazzler.cardIds[0],
			input.allCards,
			(c) =>
				hasCorrectType(c, CardType.MINION) &&
				hasCost(c, '==', 3) &&
				canBeDiscoveredByClass(c, input.inputOptions.currentClass),
			input.inputOptions,
		);
		return [...cost1Minions, ...cost2Minions, ...cost3Minions];
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const cost1Minions = filterCards(
			RazzleDazzler.cardIds[0],
			input.allCards,
			(c) =>
				hasCorrectType(c, CardType.MINION) &&
				hasCost(c, '==', 1) &&
				canBeDiscoveredByClass(c, input.deckState.getCurrentClass()),
			input.options,
		);
		const cost2Minions = filterCards(
			RazzleDazzler.cardIds[0],
			input.allCards,
			(c) =>
				hasCorrectType(c, CardType.MINION) &&
				hasCost(c, '==', 2) &&
				canBeDiscoveredByClass(c, input.deckState.getCurrentClass()),
			input.options,
		);
		const cost3Minions = filterCards(
			RazzleDazzler.cardIds[0],
			input.allCards,
			(c) =>
				hasCorrectType(c, CardType.MINION) &&
				hasCost(c, '==', 3) &&
				canBeDiscoveredByClass(c, input.deckState.getCurrentClass()),
			input.options,
		);
		return {
			cardType: CardType.MINION,
			possibleCards: [...cost1Minions, ...cost2Minions, ...cost3Minions],
		};
	},
};
