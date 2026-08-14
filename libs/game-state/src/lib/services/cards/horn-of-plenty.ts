/* eslint-disable no-mixed-spaces-and-tabs */
// Horn of Plenty (EDR_270): 2 Mana
// "[x]<b>Discover</b> a Nature spell. It costs (2) less."

import { CardIds, CardType, SpellSchool, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, canBeDiscoveredByClass, hasCorrectSpellSchool } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard, currentClass?: string) =>
	hasCorrectType(c, CardType.SPELL) &&
	hasCorrectSpellSchool(c, SpellSchool.NATURE) &&
	canBeDiscoveredByClass(c, currentClass);

export const HornOfPlenty: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.HornOfPlenty_EDR_270],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			HornOfPlenty.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.inputOptions.currentClass),
			input.inputOptions,
		),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			HornOfPlenty.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.options.currentClass),
			input.options,
		);
		return { cardType: CardType.SPELL, spellSchools: [SpellSchool.NATURE], possibleCards };
	},
};
