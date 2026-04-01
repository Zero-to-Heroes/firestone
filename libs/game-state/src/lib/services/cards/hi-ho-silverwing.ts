/* eslint-disable no-mixed-spaces-and-tabs */
// Hi Ho Silverwing (WW_344)
// 2-Cost Paladin Minion Dragon 2/1
// Divine Shield. Deathrattle: Draw a Holy spell.

import { CardIds, CardType, SpellSchool } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { GeneratingCard, GuessInfoInput } from './_card.type';

export const HiHoSilverwing: GeneratingCard = {
	cardIds: [CardIds.HiHoSilverwing_WW_344],
	publicTutor: true,
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		return {
			cardType: CardType.SPELL,
			spellSchools: [SpellSchool.HOLY],
		};
	},
};
