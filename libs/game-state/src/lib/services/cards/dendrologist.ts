/* eslint-disable no-mixed-spaces-and-tabs */
import { CardClass, CardIds, CardType } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { canBeDiscoveredByClass } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const Dendrologist: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.Dendrologist],
	publicCreator: true,
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const currentClass = input.deckState.getCurrentClass();
		const possibleCards = filterCards(
			Dendrologist.cardIds[0],
			input.allCards,
			(c) => c.type?.toUpperCase() === CardType[CardType.SPELL] && canBeDiscoveredByClass(c, currentClass),
			input.options,
		);
		return {
			cardType: CardType.SPELL,
			cardClasses: currentClass ? [CardClass[currentClass]] : undefined,
			possibleCards: possibleCards,
		};
	},
	dynamicPool: (input: StaticGeneratingCardInput) => {
		const currentClass = input.inputOptions.deckState.getCurrentClass();
		return filterCards(
			Dendrologist.cardIds[0],
			input.allCards,
			(c) => c.type?.toUpperCase() === CardType[CardType.SPELL] && canBeDiscoveredByClass(c, currentClass),
			input.inputOptions,
		);
	},
};
