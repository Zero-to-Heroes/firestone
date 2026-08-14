/* eslint-disable no-mixed-spaces-and-tabs */
// Chilling Dispense-o-bot (JAM_000t): 3 Mana 3/3 MECH
// "[x]<b>Battlecry:</b> Get two random Frost spells. <i>(Changes each turn.)</i>"

import { CardIds, CardType, SpellSchool, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, hasCorrectSpellSchool } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) => hasCorrectType(c, CardType.SPELL) && hasCorrectSpellSchool(c, SpellSchool.FROST);

export const ChillingDispenseOBot: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.RemixedDispenseOBot_ChillingDispenseOBotToken],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(ChillingDispenseOBot.cardIds[0], input.allCards, isMatch, input.inputOptions),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(ChillingDispenseOBot.cardIds[0], input.allCards, isMatch, input.options);
		return { cardType: CardType.SPELL, spellSchools: [SpellSchool.FROST], possibleCards };
	},
};
