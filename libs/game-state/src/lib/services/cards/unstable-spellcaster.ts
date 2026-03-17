// Unstable Spellcaster - CATA_483
// 4 Mana 2/5 Mage Elemental Minion
// Spell Damage +1. Battlecry: If you dealt damage with a spell this turn, summon a copy of this.
import { CardIds, CardType } from '@firestone-hs/reference-data';
import { WillBeActiveCard, WillBeActiveInput } from './_card.type';

export const UnstableSpellcaster: WillBeActiveCard = {
	cardIds: [CardIds.UnstableSpellcaster_CATA_483],
	willBeActive: (input: WillBeActiveInput) => {
		return input.playerDeck.damageDealtThisTurn.some(
			(d) => input.allCards.getCard(d.sourceCardId).type?.toUpperCase() === CardType[CardType.SPELL],
		);
	},
};
