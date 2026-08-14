/* eslint-disable no-mixed-spaces-and-tabs */
// Taste of Chaos (ETC_394): 1 Mana
// "Deal $2 damage to a minion. <b>Finale:</b> <b>Discover</b> a Fel spell."

import { CardIds, SpellSchool, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { canBeDiscoveredByClass, hasCorrectSpellSchool } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard, currentClass?: string) =>
	hasCorrectSpellSchool(c, SpellSchool.FEL) && canBeDiscoveredByClass(c, currentClass);

export const TasteOfChaos: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.TasteOfChaos],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			TasteOfChaos.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.inputOptions.currentClass),
			input.inputOptions,
		),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			TasteOfChaos.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.options.currentClass),
			input.options,
		);
		return { spellSchools: [SpellSchool.FEL], possibleCards };
	},
};
