/* eslint-disable no-mixed-spaces-and-tabs */
// Uluu, the Everdrifter (GDB_854): 5 Mana Druid Legendary minion
// "Each turn this is in your hand, gain two random Choose One choices."
// The choices are random (not discovered), so only dynamicPool is needed

import { CardIds, GameTag, hasMechanic } from '@firestone-hs/reference-data';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const UluuTheEverdrifter: StaticGeneratingCard = {
	cardIds: [CardIds.UluuTheEverdrifter_GDB_854],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			UluuTheEverdrifter.cardIds[0],
			input.allCards,
			(c) => hasMechanic(c, GameTag.CHOOSE_ONE),
			input.inputOptions,
		);
	},
};
