/* eslint-disable no-mixed-spaces-and-tabs */
// Lifebinder's Gift (TTN_955): 2 Mana
// "<b>Choose One -</b> Get 2 random Nature spells; or Reduce the Cost of spells in your hand by (1)."

import { CardIds, CardType, SpellSchool, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, hasCorrectSpellSchool } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) => hasCorrectType(c, CardType.SPELL) && hasCorrectSpellSchool(c, SpellSchool.NATURE);

export const LifebindersGift: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.LifebindersGift],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(LifebindersGift.cardIds[0], input.allCards, isMatch, input.inputOptions),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(LifebindersGift.cardIds[0], input.allCards, isMatch, input.options);
		return { cardType: CardType.SPELL, spellSchools: [SpellSchool.NATURE], possibleCards };
	},
};
