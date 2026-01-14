/* eslint-disable no-mixed-spaces-and-tabs */
// TIME_211t2: Zin-Azshari
// "Summon a copy of a friendly minion."
// 
// TIME_211t2t: Zin-Azshari (Enhanced)
// "Summon a copy of a friendly minion with its stats doubled."
// 
// These cards summon a copy of a friendly minion currently on the board.
// The dynamic pool should show all friendly minions on the player's board.

import { CardIds } from '@firestone-hs/reference-data';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';

export const ZinAzshari: StaticGeneratingCard = {
	cardIds: [CardIds.LadyAzshara_ZinAzshariToken_TIME_211t2, CardIds.ZinAzshari_ZinAzshariToken_TIME_211t2t],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		// Return the card IDs of all friendly minions currently on the board
		return input.inputOptions.deckState.board.map((minion) => minion.cardId);
	},
};
