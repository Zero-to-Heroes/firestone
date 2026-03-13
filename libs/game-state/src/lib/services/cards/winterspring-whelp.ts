/* eslint-disable no-mixed-spaces-and-tabs */
// Winterspring Whelp (CATA_484): 1 Mana 2/1 Dragon
// "Battlecry: Add a random Frost spell to your hand."

import { CardIds, CardType, hasSpellSchool, SpellSchool } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const WinterspringWhelp: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.WinterspringWhelp_CATA_484],
	publicCreator: true,
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			WinterspringWhelp.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.SPELL) && hasSpellSchool(c, SpellSchool.FROST),
			input.options,
		);
		return {
			cardType: CardType.SPELL,
			spellSchools: [SpellSchool.FROST],
			possibleCards: possibleCards,
		};
	},
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			WinterspringWhelp.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.SPELL) && hasSpellSchool(c, SpellSchool.FROST),
			input.inputOptions,
		);
	},
};
