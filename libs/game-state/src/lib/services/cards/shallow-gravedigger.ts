/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType, GameTag, hasMechanic } from '@firestone-hs/reference-data';
import { canBeDiscoveredByClass, hasCorrectType } from '../../related-cards/dynamic-pools';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

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
