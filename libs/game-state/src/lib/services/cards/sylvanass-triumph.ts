// Sylvanas's Triumph - CATA_557
// 2 Mana Hunter Spell
// Deal 3 damage. If you've played another copy of this, hit all enemies instead.
import { CardIds } from '@firestone-hs/reference-data';
import { WillBeActiveCard, WillBeActiveInput } from './_card.type';

export const SylvanassTriumph: WillBeActiveCard = {
	cardIds: [CardIds.SylvanassTriumph_CATA_557],
	willBeActive: (input: WillBeActiveInput) => {
		return input.playerDeck.cardsPlayedThisMatch.some((c) => c.cardId === CardIds.SylvanassTriumph_CATA_557);
	},
};
