/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType, Race } from '@firestone-hs/reference-data';
import { hasCorrectTribe } from '@firestone-hs/reference-data';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';
import { hasCorrectType, canBeDiscoveredByClass } from '../../related-cards/dynamic-pools';

export const EarthenMight: StaticGeneratingCard = {
	cardIds: [CardIds.EarthenMight],
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			EarthenMight.cardIds[0],
			input.allCards,
			(c) =>
				hasCorrectType(c, CardType.MINION) &&
				hasCorrectTribe(c, Race.ELEMENTAL) &&
				canBeDiscoveredByClass(c, input.inputOptions.currentClass),
			input.inputOptions,
		);
	},
};
