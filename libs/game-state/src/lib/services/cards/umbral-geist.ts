/* eslint-disable no-mixed-spaces-and-tabs */
// Umbral Geist (RLK_914): 2 Mana 3/1 UNDEAD
// "[x]<b>Deathrattle:</b> Add a random Shadow spell to your hand."

import { CardIds, CardType, SpellSchool, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, hasCorrectSpellSchool } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) => hasCorrectType(c, CardType.SPELL) && hasCorrectSpellSchool(c, SpellSchool.SHADOW);

export const UmbralGeist: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.UmbralGeist],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(UmbralGeist.cardIds[0], input.allCards, isMatch, input.inputOptions),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(UmbralGeist.cardIds[0], input.allCards, isMatch, input.options);
		return { cardType: CardType.SPELL, spellSchools: [SpellSchool.SHADOW], possibleCards };
	},
};
