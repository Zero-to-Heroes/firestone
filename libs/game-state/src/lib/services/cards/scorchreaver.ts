/* eslint-disable no-mixed-spaces-and-tabs */
// Scorchreaver (FIR_952): 4 Mana 4/4
// "[x]<b>Battlecry:</b> <b>Discover</b> a Fel spell. Reduce the Cost of Fel spells in your hand by (1)."

import { CardIds, SpellSchool, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { canBeDiscoveredByClass, hasCorrectSpellSchool } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard, currentClass?: string) =>
	hasCorrectSpellSchool(c, SpellSchool.FEL) && canBeDiscoveredByClass(c, currentClass);

export const Scorchreaver: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.Scorchreaver_FIR_952],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			Scorchreaver.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.inputOptions.currentClass),
			input.inputOptions,
		),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			Scorchreaver.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.options.currentClass),
			input.options,
		);
		return { spellSchools: [SpellSchool.FEL], possibleCards };
	},
};
