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
	let additionalKnownCards = [...additionalKnownCardsInHand].filter((c) => {
		const handRowsWithId = cards.filter((card) => card.cardId === c).length;
		// One hand row with this id: suppress duplicate entries in `additional` (legacy double-tracking).
		// Multiple rows with the same id: keep every additional entry — the old `!some(cardId)` wrongly dropped
		// extras when several physical copies share one cardId (e.g. Sigil of Cinder x3).
		if (handRowsWithId > 1) {
			return true;
		}
		return !cards.some((card) => card.cardId === c);
	});

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

/**
 * Sequential hand reveals of the same card ID must not increment (it may be the same physical card)
 * and must not collapse an existing simultaneous multiplicity back to 1.
 * Simultaneous multi-copy (`allowDuplicate`) always appends.
 */
export function appendKnownCardInOpponentHand(
	known: readonly string[],
	cardIdToAdd: string,
	allowDuplicate = false,
): readonly string[] {
	if (!cardIdToAdd) {
		return known;
	}
	if (allowDuplicate) {
		return [...known, cardIdToAdd];
	}
	return known.includes(cardIdToAdd) ? known : [...known, cardIdToAdd];
}
