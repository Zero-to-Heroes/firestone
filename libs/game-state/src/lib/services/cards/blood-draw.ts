/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { canBeDiscoveredByClass, hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const BloodDraw: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.BloodDraw_TIME_612],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			BloodDraw.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.SPELL) && canBeDiscoveredByClass(c, input.inputOptions.currentClass),
			input.inputOptions,
		),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		return {
			cardType: CardType.SPELL,
			possibleCards: filterCards(
				BloodDraw.cardIds[0],
				input.allCards,
				(c) => hasCorrectType(c, CardType.SPELL) && canBeDiscoveredByClass(c, input.options.currentClass),
				input.options,
			),
		};
	},
};
