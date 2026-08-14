/* eslint-disable no-mixed-spaces-and-tabs */
// Inferno Herald (FIR_913): 4 Mana 3/6 ELEMENTAL
// "[x]After you cast a Fire spell, get a random Elemental and reduce its Cost by (3)."

import { CardIds, Race, hasCorrectTribe, ReferenceCard } from '@firestone-hs/reference-data';

import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) => hasCorrectTribe(c, Race.ELEMENTAL);

export const InfernoHerald: StaticGeneratingCard = {
	cardIds: [CardIds.InfernoHerald_FIR_913],
	summonInPlay: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(InfernoHerald.cardIds[0], input.allCards, isMatch, input.inputOptions),
};
