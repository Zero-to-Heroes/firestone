/* eslint-disable no-mixed-spaces-and-tabs */
// Cremate (FIR_900): 3 Mana
// "<b>Discover</b> a minion with a <b>Dark Gift</b>. It costs (2) less."

import { CardIds, CardType, ReferenceCard } from '@firestone-hs/reference-data';

import { hasCorrectType, canBeDiscoveredByClass } from '../../related-cards/dynamic-pools';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard, currentClass?: string) =>
	hasCorrectType(c, CardType.MINION) && canBeDiscoveredByClass(c, currentClass);

export const Cremate: StaticGeneratingCard = {
	cardIds: [CardIds.Cremate_FIR_900],
	summonInPlay: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			Cremate.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.inputOptions.currentClass),
			input.inputOptions,
		),
};
