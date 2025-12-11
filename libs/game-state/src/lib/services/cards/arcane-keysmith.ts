/* eslint-disable no-mixed-spaces-and-tabs */
import { CardClass, CardIds, CardType, GameTag, hasMechanic } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { canBeDiscoveredByClass, hasCorrectClass, hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const ArcaneKeysmith: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.ArcaneKeysmith],
	publicCreator: true,
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const currentClassStr = input.deckState.getCurrentClass();
		const currentClass = currentClassStr ? CardClass[currentClassStr] : null;
		return {
			cardType: CardType.SPELL,
			mechanics: [GameTag.SECRET],
			cardClasses: currentClass ? [currentClass] : undefined,
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
		const currentClassStr = input.inputOptions.deckState.getCurrentClass();
		const currentClass = currentClassStr ? CardClass[currentClassStr] : null;
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
