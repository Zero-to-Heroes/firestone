/* eslint-disable no-mixed-spaces-and-tabs */
// Baleful Blazer (CATA_EVENT_002): 3 Mana 4/3 Warrior Elemental Epic
// "Battlecry: If you've played a Fire spell this turn, destroy a minion."
import { CardIds, CardType, SpellSchool } from '@firestone-hs/reference-data';
import { WillBeActiveCard, WillBeActiveInput } from './_card.type';

export const BalefulBlazer: WillBeActiveCard = {
	cardIds: [CardIds.BalefulBlazer_CATA_EVENT_002],
	willBeActive: (input: WillBeActiveInput) => {
		return input.playerDeck.cardsPlayedThisTurn.some(
			(c) =>
				input.allCards.getCard(c.cardId).type?.toUpperCase() === CardType[CardType.SPELL] &&
				input.allCards.getCard(c.cardId).spellSchool === SpellSchool[SpellSchool.FIRE],
		);
	},
};
