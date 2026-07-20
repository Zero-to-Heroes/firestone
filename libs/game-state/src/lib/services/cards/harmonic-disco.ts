import { CardIds, CardType } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { canBeDiscoveredByClass, hasCost } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const HarmonicDisco: StaticGeneratingCard & GeneratingCard = {
	cardIds: [CardIds.HarmonicDisco],
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			HarmonicDisco.cardIds[0],
			input.allCards,
			(c) =>
				c.type?.toUpperCase() === CardType[CardType.MINION] &&
				hasCost(c, '==', 5) &&
				canBeDiscoveredByClass(c, input.inputOptions.deckState.getCurrentClass()),
			input.inputOptions,
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			HarmonicDisco.cardIds[0],
			input.allCards,
			(c) =>
				c.type?.toUpperCase() === CardType[CardType.MINION] &&
				hasCost(c, '==', 5) &&
				canBeDiscoveredByClass(c, input.deckState.getCurrentClass()),
			input.options,
		);
		return {
			cardType: CardType.MINION,
			cost: 5,
			possibleCards: possibleCards,
		};
	},
};

export const DissonantDisco: StaticGeneratingCard & GeneratingCard = {
	cardIds: [CardIds.HarmonicDisco_DissonantDiscoToken],
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			DissonantDisco.cardIds[0],
			input.allCards,
			(c) =>
				c.type?.toUpperCase() === CardType[CardType.MINION] &&
				hasCost(c, '==', 1) &&
				canBeDiscoveredByClass(c, input.inputOptions.deckState.getCurrentClass()),
			input.inputOptions,
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			DissonantDisco.cardIds[0],
			input.allCards,
			(c) =>
				c.type?.toUpperCase() === CardType[CardType.MINION] &&
				hasCost(c, '==', 1) &&
				canBeDiscoveredByClass(c, input.deckState.getCurrentClass()),
			input.options,
		);
		return {
			cardType: CardType.MINION,
			cost: 1,
			possibleCards: possibleCards,
		};
	},
};
