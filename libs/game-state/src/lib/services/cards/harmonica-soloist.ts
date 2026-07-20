/* eslint-disable no-mixed-spaces-and-tabs */
import { CardClass, CardIds, GameTag, hasMechanic } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { canBeDiscoveredByClass } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const HarmonicaSoloist: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.HarmonicaSoloist],
	publicCreator: true,
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const currentClassStr = input.deckState.getCurrentClass();
		const currentClass = currentClassStr ? CardClass[currentClassStr] : null;
		const possibleCards = filterCards(
			HarmonicaSoloist.cardIds[0],
			input.allCards,
			(c) => hasMechanic(c, GameTag.SECRET) && canBeDiscoveredByClass(c, currentClass),
			input.options,
		);
		return {
			mechanics: [GameTag.SECRET],
			cardClasses: currentClass ? [currentClass] : undefined,
			possibleCards: possibleCards,
		};
	},
	dynamicPool: (input: StaticGeneratingCardInput) => {
		const currentClassStr = input.inputOptions.currentClass;
		const currentClass = currentClassStr ? CardClass[currentClassStr] : null;
		return filterCards(
			HarmonicaSoloist.cardIds[0],
			input.allCards,
			(c) => hasMechanic(c, GameTag.SECRET) && canBeDiscoveredByClass(c, currentClass),
			input.inputOptions,
		);
	},
};
