/* eslint-disable no-mixed-spaces-and-tabs */
// Submerged Spacerock (TID_707): 2 Mana 2/2 ELEMENTAL
// "[x]<b>Deathrattle:</b> Add two Arcane Mage spells to your hand. They are <b>Temporary</b>."

import { CardIds, CardType, CardClass, SpellSchool, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, hasCorrectClass, hasCorrectSpellSchool } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) =>
	hasCorrectType(c, CardType.SPELL) &&
	hasCorrectSpellSchool(c, SpellSchool.ARCANE) &&
	hasCorrectClass(c, CardClass.MAGE);

export const SubmergedSpacerock: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.SubmergedSpacerock],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(SubmergedSpacerock.cardIds[0], input.allCards, isMatch, input.inputOptions),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(SubmergedSpacerock.cardIds[0], input.allCards, isMatch, input.options);
		return {
			cardType: CardType.SPELL,
			spellSchools: [SpellSchool.ARCANE],
			cardClasses: [CardClass.MAGE],
			possibleCards,
		};
	},
};
