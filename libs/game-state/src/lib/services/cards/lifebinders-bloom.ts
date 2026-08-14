/* eslint-disable no-mixed-spaces-and-tabs */
// Lifebinder's Bloom (TTN_955A): 2 Mana
// "Get 2 random Nature spells."

import { CardIds, CardType, SpellSchool, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, hasCorrectSpellSchool } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) => hasCorrectType(c, CardType.SPELL) && hasCorrectSpellSchool(c, SpellSchool.NATURE);

export const LifebindersBloom: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.LifebindersBloom],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(LifebindersBloom.cardIds[0], input.allCards, isMatch, input.inputOptions),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(LifebindersBloom.cardIds[0], input.allCards, isMatch, input.options);
		return { cardType: CardType.SPELL, spellSchools: [SpellSchool.NATURE], possibleCards };
	},
};
