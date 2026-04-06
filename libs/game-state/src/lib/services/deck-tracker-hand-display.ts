import { ReferenceCard } from '@firestone-hs/reference-data';
import { DeckCard } from '../models/deck-card';
import { DeckState } from '../models/deck-state';

/** {@link CardsFacadeService} and {@link AllCardsService} both satisfy this for deck tracker display. */
export type DeckTrackerCardLookup = { getCard(cardId: string | number): ReferenceCard | undefined };

/**
 * Merges {@link DeckState.hand} with {@link DeckState.additionalKnownCardsInHand} the same way the
 * deck tracker overlay builds the hand zone: duplicate known IDs are dropped, placeholder hand rows
 * (no cardId and no creatorCardId) are removed when pairing with additional known IDs, then synthetic
 * {@link DeckCard} rows are appended for remaining additional IDs.
 */
export function mergeHandCardsForDeckTrackerDisplay(
	cards: readonly DeckCard[],
	additionalKnownCardsInHand: readonly string[],
	allCards: DeckTrackerCardLookup,
): readonly DeckCard[] {
	let additionalKnownCards = [...additionalKnownCardsInHand].filter(
		(c) => !cards.some((card) => card.cardId === c),
	);

	let newCards: readonly DeckCard[] = cards;
	for (let i = 0; i < additionalKnownCards.length; i++) {
		const placeholder = newCards.find((c) => !c.cardId && !c.creatorCardId);
		if (placeholder) {
			newCards = newCards.filter((c) => c !== placeholder);
		}
	}
	return [
		...newCards,
		...additionalKnownCards.map((c) =>
			DeckCard.create({
				cardId: c,
				cardName: allCards.getCard(c)?.name,
				refManaCost: allCards.getCard(c)?.cost,
			}),
		),
	];
}

/** Card count shown in deck tracker for hand (matches merged hand list, not always `hand.length`). */
export function getDeckTrackerEffectiveHandSize(deck: DeckState, allCards: DeckTrackerCardLookup): number {
	return mergeHandCardsForDeckTrackerDisplay(deck.hand, deck.additionalKnownCardsInHand, allCards).length;
}
