/* eslint-disable no-mixed-spaces-and-tabs */
// The Scourge (RLK_122): 9 Mana Death Knight Spell (2 Unholy Runes)
// "Fill your board with random Undead."
// The minions are summoned, so only dynamicPool is needed (no guessInfo)

import { CardIds, CardType, hasCorrectTribe, Race } from '@firestone-hs/reference-data';
import { hasCorrectType } from '../../related-cards/dynamic-pools';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const TheScourge: StaticGeneratingCard = {
	cardIds: [
		CardIds.TheScourge_RLK_122,
		CardIds.TheScourge_CORE_RLK_122,
		CardIds.TheScourge_RLK_Prologue_TheScourge_003s,
		CardIds.TheScourge_TUTR_TheScourge_003s,
	],
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			TheScourge.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.MINION) && hasCorrectTribe(c, Race.UNDEAD),
			input.inputOptions,
		);
	},
};
