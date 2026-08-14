/* eslint-disable no-mixed-spaces-and-tabs */
// Lightning Reflexes (TTN_317): 1 Mana
// "[x]<b>Discover</b> a Nature spell. If you play it this turn, <b>Discover</b> another."

import { CardIds, CardType, SpellSchool, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, canBeDiscoveredByClass, hasCorrectSpellSchool } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard, currentClass?: string) =>
	hasCorrectType(c, CardType.SPELL) &&
	hasCorrectSpellSchool(c, SpellSchool.NATURE) &&
	canBeDiscoveredByClass(c, currentClass);

export const LightningReflexes: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.LightningReflexes],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			LightningReflexes.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.inputOptions.currentClass),
			input.inputOptions,
		),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			LightningReflexes.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.options.currentClass),
			input.options,
		);
		return { cardType: CardType.SPELL, spellSchools: [SpellSchool.NATURE], possibleCards };
	},
};
