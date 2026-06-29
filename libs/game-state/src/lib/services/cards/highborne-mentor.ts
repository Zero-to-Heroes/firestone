/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType } from '@firestone-hs/reference-data';
import { canBeDiscoveredByClass, hasCorrectType, hasCost } from '../../related-cards/dynamic-pools';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCardsFromThePast } from './utils';

export const HighborneMentor: StaticGeneratingCard = {
	cardIds: [CardIds.HighborneMentor_TIME_704, CardIds.HighborneMentor_HighbornePupilToken_TIME_704t],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCardsFromThePast(
			HighborneMentor.cardIds[0],
			input.allCards,
			(c) =>
				hasCorrectType(c, CardType.SPELL) &&
				hasCost(c, '>=', 7) &&
				canBeDiscoveredByClass(c, input.inputOptions.currentClass),
			input.inputOptions,
		);
	},
};
