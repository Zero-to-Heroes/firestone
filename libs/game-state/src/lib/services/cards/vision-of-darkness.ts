/* eslint-disable no-mixed-spaces-and-tabs */
// Vision of Darkness (RLK_816t3): 3 Mana
// "[x]<b>Discover</b> a Shadow spell. <i>(This stays in your hand.)</i>"

import { CardIds, SpellSchool, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { canBeDiscoveredByClass, hasCorrectSpellSchool } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard, currentClass?: string) =>
	hasCorrectSpellSchool(c, SpellSchool.SHADOW) && canBeDiscoveredByClass(c, currentClass);

export const VisionOfDarkness: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.SisterSvalna_VisionOfDarknessToken],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			VisionOfDarkness.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.inputOptions.currentClass),
			input.inputOptions,
		),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			VisionOfDarkness.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.options.currentClass),
			input.options,
		);
		return { spellSchools: [SpellSchool.SHADOW], possibleCards };
	},
};
