/* eslint-disable no-mixed-spaces-and-tabs */
import { CardClass, CardIds, CardType } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const AeonWizard: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.AeonWizard_TIME_002],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			AeonWizard.cardIds[0],
			input.allCards,
			(c) =>
				hasCorrectType(c, CardType.SPELL) &&
				!!input.inputOptions.currentClass &&
				c.classes?.includes(input.inputOptions.currentClass.toUpperCase()),
			input.inputOptions,
		),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const currentClass = input.options.currentClass;
		return {
			cardType: CardType.SPELL,
			cardClasses: currentClass ? [CardClass[currentClass.toUpperCase()]] : undefined,
			possibleCards: filterCards(
				AeonWizard.cardIds[0],
				input.allCards,
				(c) =>
					hasCorrectType(c, CardType.SPELL) &&
					!!currentClass &&
					c.classes?.includes(currentClass.toUpperCase()),
				input.options,
			),
		};
	},
};
