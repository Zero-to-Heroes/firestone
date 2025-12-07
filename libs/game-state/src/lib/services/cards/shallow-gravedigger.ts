/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType, GameTag } from '@firestone-hs/reference-data';
import { hasMechanic } from '@firestone-hs/reference-data';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';
import { hasCorrectType, canBeDiscoveredByClass } from '../../related-cards/dynamic-pools';

export const ShallowGravedigger: StaticGeneratingCard = {
	cardIds: [CardIds.ShallowGravedigger_ICC_702, CardIds.ShallowGravedigger_CORE_ICC_702],
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			ShallowGravedigger.cardIds[0],
			input.allCards,
			(c) =>
				hasCorrectType(c, CardType.MINION) &&
				hasMechanic(c, GameTag.DEATHRATTLE) &&
				canBeDiscoveredByClass(c, input.inputOptions.currentClass),
			input.inputOptions,
		);
	},
};
