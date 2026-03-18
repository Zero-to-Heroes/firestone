// Vyranoth - CATA_213
// 6 Mana 6/6 Neutral Elemental Minion
// Battlecry: If the total Cost of your starting minions was 100, split 100 stats among minions in your deck.
import { CardIds, CardType } from '@firestone-hs/reference-data';
import { WillBeActiveCard, WillBeActiveInput } from './_card.type';

export const Vyranoth: WillBeActiveCard = {
	cardIds: [CardIds.Vyranoth_CATA_213],
	willBeActive: (input: WillBeActiveInput) => {
		const totalCost = input.playerDeck.deckList.reduce((sum, c) => {
			const ref = input.allCards.getCard(c.cardId);
			return ref.type?.toUpperCase() === CardType[CardType.MINION] ? sum + (ref.cost ?? 0) : sum;
		}, 0);
		return totalCost === 100;
	},
};
