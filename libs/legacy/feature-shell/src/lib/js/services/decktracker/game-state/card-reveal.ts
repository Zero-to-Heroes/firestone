import { CardIds } from '@firestone-hs/reference-data';
import { DeckCard, DeckState } from '@firestone/game-state';

// TODO: also check the cardCopyLink, which looks like it does more or less the same thing
export const revealCard = (deck: DeckState, card: DeckCard) => {
	console.debug('[card-reveal]', card.cardName, card, deck);
	const creatorEntityId = card.creatorEntityId || card.lastAffectedByEntityId;
	const creatorCardId = card.creatorCardId || card.lastAffectedByCardId;
	if (!creatorEntityId || !creatorCardId) {
		return deck;
	}

	switch (creatorCardId) {
		case CardIds.Triangulate_GDB_451:
			console.debug(
				'[card-reveal] revealCard Triangulate_GDB_451',
				card.cardName,
				card,
				deck,
				updateCardsInDeckAsCopies(deck, card, creatorEntityId, creatorCardId),
			);
			return updateCardsInDeckAsCopies(deck, card, creatorEntityId, creatorCardId);
		default:
			return deck;
	}
};

const updateCardsInDeckAsCopies = (deck: DeckState, card: DeckCard, creatorEntityId: number, creatorCardId: string) => {
	return deck.update({
		deck: updateCardsInZoneAsCopies(deck.deck, card, creatorEntityId, creatorCardId),
		hand: updateCardsInZoneAsCopies(deck.hand, card, creatorEntityId, creatorCardId),
	});
};

const updateCardsInZoneAsCopies = (
	zone: readonly DeckCard[],
	card: DeckCard,
	creatorEntityId: number,
	creatorCardId: string,
) => {
	return zone.map((c) =>
		c.creatorEntityId === creatorEntityId
			? c.update({
					cardId: card.cardId,
					cardName: card.cardName,
					rarity: card.rarity,
					refManaCost: card.refManaCost,
					cardType: card.cardType,
				})
			: c,
	);
};
