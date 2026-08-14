/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Perjury (MAW_018 / CORE_MAW_018)
 * Secret: When your turn starts, Discover and cast a Secret from another class.
 */
import { ALL_CLASSES, CardClass, CardIds, CardType, GameTag, hasMechanic } from '@firestone-hs/reference-data';

import { GuessedInfo } from '../../models/deck-card';
import { fromAnotherClass, hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const Perjury: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.Perjury, CardIds.Perjury_CORE_MAW_018],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		const currentClass = input.inputOptions.deckState.getCurrentClass();
		return filterCards(
			Perjury.cardIds[0],
			input.allCards,
			(c) =>
				hasMechanic(c, GameTag.SECRET) &&
				hasCorrectType(c, CardType.SPELL) &&
				fromAnotherClass(c, currentClass),
			input.inputOptions,
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const currentClass = input.deckState.getCurrentClass();
		const cardClasses = ALL_CLASSES.filter((c) => c.toUpperCase() !== currentClass?.toUpperCase()).map(
			(c) => CardClass[c.toUpperCase()],
		);
		return {
			cardType: CardType.SPELL,
			cardClasses: cardClasses,
			possibleCards: filterCards(
				Perjury.cardIds[0],
				input.allCards,
				(c) =>
					hasMechanic(c, GameTag.SECRET) &&
					hasCorrectType(c, CardType.SPELL) &&
					fromAnotherClass(c, currentClass),
				input.options,
			),
		};
	},
};
