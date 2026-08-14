/* eslint-disable no-mixed-spaces-and-tabs */
// Rite of Atrocity (EDR_811): 1 Mana
// "<b>Discover</b> an Undead. Spend 2 <b>Corpses</b> to give it a <b>Dark Gift</b>."

import { CardIds, Race, hasCorrectTribe, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { canBeDiscoveredByClass } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard, currentClass?: string) =>
	hasCorrectTribe(c, Race.UNDEAD) && canBeDiscoveredByClass(c, currentClass);

export const RiteOfAtrocity: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.RiteOfAtrocity_EDR_811],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			RiteOfAtrocity.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.inputOptions.currentClass),
			input.inputOptions,
		),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			RiteOfAtrocity.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.options.currentClass),
			input.options,
		);
		return { races: [Race.UNDEAD], possibleCards };
	},
};
