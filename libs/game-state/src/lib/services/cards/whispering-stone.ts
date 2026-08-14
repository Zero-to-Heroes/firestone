/* eslint-disable no-mixed-spaces-and-tabs */
// Whispering Stone (TLC_467): 5 Mana 0/8
// "[x]<b>Taunt</b> <b>Deathrattle:</b> Get 2 random Fel spells. They cost Health instead of Mana."

import { CardIds, CardType, SpellSchool, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, hasCorrectSpellSchool } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) => hasCorrectType(c, CardType.SPELL) && hasCorrectSpellSchool(c, SpellSchool.FEL);

export const WhisperingStone: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.WhisperingStone_TLC_467],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(WhisperingStone.cardIds[0], input.allCards, isMatch, input.inputOptions),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(WhisperingStone.cardIds[0], input.allCards, isMatch, input.options);
		return { cardType: CardType.SPELL, spellSchools: [SpellSchool.FEL], possibleCards };
	},
};
