/* eslint-disable no-mixed-spaces-and-tabs */
import { CardClass, CardIds, CardType, GameTag, hasMechanic } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { canBeDiscoveredByClass, hasCorrectClass, hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const ArcaneKeysmith: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.ArcaneKeysmith_GIL_116],
	publicCreator: true,
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const currentClass = input.deckState.getCurrentClass();
		return {
			cardType: CardType.SPELL,
			mechanics: [GameTag.SECRET],
			cardClasses: currentClass ? [CardClass[currentClass]] : undefined,
			possibleCards: filterCards(
				ArcaneKeysmith.cardIds[0],
				input.allCards,
				(c) =>
					hasCorrectType(c, CardType.SPELL) &&
					hasMechanic(c, GameTag.SECRET) &&
					hasCorrectClass(c, currentClass) &&
					canBeDiscoveredByClass(c, currentClass),
				input.options,
			),
		};
	},
	dynamicPool: (input: StaticGeneratingCardInput) => {
		const currentClass = input.inputOptions.currentClass;
		return filterCards(
			ArcaneKeysmith.cardIds[0],
			input.allCards,
			(c) =>
				hasCorrectType(c, CardType.SPELL) &&
				hasMechanic(c, GameTag.SECRET) &&
				hasCorrectClass(c, currentClass) &&
				canBeDiscoveredByClass(c, currentClass),
			input.inputOptions,
		);
	},
};
