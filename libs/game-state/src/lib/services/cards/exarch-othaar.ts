/* eslint-disable no-mixed-spaces-and-tabs */
// Exarch Othaar (GDB_856): 3 Mana 3/3 DRAENEI
// "[x]<b>Battlecry:</b> If you're building a <b>Starship</b>, get 3 different Arcane spells and reduce their Costs by (2)."

import { CardIds, CardType, SpellSchool, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, hasCorrectSpellSchool } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) => hasCorrectType(c, CardType.SPELL) && hasCorrectSpellSchool(c, SpellSchool.ARCANE);

export const ExarchOthaar: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.ExarchOthaar_GDB_856],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(ExarchOthaar.cardIds[0], input.allCards, isMatch, input.inputOptions),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(ExarchOthaar.cardIds[0], input.allCards, isMatch, input.options);
		return { cardType: CardType.SPELL, spellSchools: [SpellSchool.ARCANE], possibleCards };
	},
};
