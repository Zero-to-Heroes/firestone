import { CardIds } from '@firestone-hs/reference-data';
import { DeckCard } from './deck-card';

/**
 * When the tracker has narrowed an unknown card to exactly one possibility (`guessedInfo.possibleCards`),
 * treat that id as the display identity (hand markers and "In hand" list should match).
 */
export function getDisplayCardIdWhenGuessedPoolIsSingleCard(card: DeckCard): string | null {
	if (card.cardId) {
		return null;
	}
	// Godfrey returns are random among burned cards — never reveal the identity in opponent hand.
	if (card.creatorCardId === CardIds.GodfreyTheBetrayer_GodfreysAtlasEnchantment_JAIL_509e) {
		return null;
	}
	const pool = card.guessedInfo?.possibleCards;
	if (pool?.length === 1 && pool[0]?.length) {
		return pool[0];
	}
	return null;
}
