/* eslint-disable no-mixed-spaces-and-tabs */
// TIME_211t2: Zin-Azshari
// "Summon a copy of a friendly minion."
// 
// TIME_211t2t: Zin-Azshari (Enhanced)
// "Summon a copy of a friendly minion with its stats doubled."
// 
// These cards summon a copy of a friendly minion currently on the board.
// The dynamic pool should show all friendly minions on the player's board.

import { CardIds, CardType } from '@firestone-hs/reference-data';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';

export const ZinAzshari: StaticGeneratingCard = {
	cardIds: [CardIds.LadyAzshara_ZinAzshariToken_TIME_211t2, CardIds.ZinAzshari_ZinAzshariToken_TIME_211t2t],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		// Return the card IDs of all friendly minions currently on the board
		// Filter to only include minions (board can contain other card types)
		return input.inputOptions.deckState.board
			.filter((card) => card.cardType === CardType[CardType.MINION])
			.map((minion) => minion.cardId);
	},
};
