/* eslint-disable no-mixed-spaces-and-tabs */
// Galactic Crusader (GDB_862): 7 Mana 3/9 DRAENEI
// "<b>Taunt</b> <b>Deathrattle:</b> Get two random Holy spells. They cost (3) less."

import { CardIds, CardType, SpellSchool, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) =>
	hasCorrectType(c, CardType.SPELL) && c?.spellSchool?.includes(SpellSchool[SpellSchool.HOLY]);

export const GalacticCrusader: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.GalacticCrusader_GDB_862],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(GalacticCrusader.cardIds[0], input.allCards, isMatch, input.inputOptions),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(GalacticCrusader.cardIds[0], input.allCards, isMatch, input.options);
		return { cardType: CardType.SPELL, spellSchools: [SpellSchool.HOLY], possibleCards };
	},
};
