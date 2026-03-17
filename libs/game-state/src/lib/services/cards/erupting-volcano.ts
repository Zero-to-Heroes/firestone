// Erupting Volcano - CATA_584
// 3 Mana Warrior Location (3 Durability)
// Deal 3 damage randomly split among enemies. If you've played a Fire spell this turn, deal 3 more.
import { CardIds, CardType, SpellSchool } from '@firestone-hs/reference-data';
import { WillBeActiveCard, WillBeActiveInput } from './_card.type';

export const EruptingVolcano: WillBeActiveCard = {
	cardIds: [CardIds.EruptingVolcano_CATA_584],
	willBeActive: (input: WillBeActiveInput) => {
		return input.playerDeck.cardsPlayedThisTurn.some(
			(c) =>
				input.allCards.getCard(c.cardId).type?.toUpperCase() === CardType[CardType.SPELL] &&
				input.allCards.getCard(c.cardId).spellSchool === SpellSchool[SpellSchool.FIRE],
		);
	},
};
