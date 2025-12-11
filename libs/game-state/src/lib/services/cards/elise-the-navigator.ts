/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds } from '@firestone-hs/reference-data';
import { WillBeActiveCard, WillBeActiveInput } from './_card.type';

export const EliseTheNavigator: WillBeActiveCard = {
	cardIds: [CardIds.EliseTheNavigator_TLC_100],
	willBeActive: (input: WillBeActiveInput) => {
		// Check if the initial list has 10 different cost cards - so we don't care about the current cost,
		// just what it is from the ref files at the start of the game
		const initialList = input.playerDeck.deckList.map((c) => input.allCards.getCard(c.cardId).cost);
		const uniqueCosts = new Set(initialList);
		return uniqueCosts.size >= 10;
	},
};
