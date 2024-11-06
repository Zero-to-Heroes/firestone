import { CardIds } from '@firestone-hs/reference-data';
import { DeckCard } from '../models/deck-card';
import { DeckState } from '../models/deck-state';

export const enrichDeck = (deckState: DeckState): DeckState => {
	const behemothUpgrades = deckState.globalEffects.filter((g) => g.cardId === CardIds.BolideBehemoth_GDB_434).length;
	return deckState.update({
		deck: updateAdditionalAttributes(deckState.deck, behemothUpgrades),
		hand: updateAdditionalAttributes(deckState.hand, behemothUpgrades),
	});
};

const updateAdditionalAttributes = (cards: readonly DeckCard[], behemothUpgrades: number): readonly DeckCard[] => {
	return cards.map((card) => {
		if (card.cardId === CardIds.Asteroid_GDB_430) {
			return card.update({
				mainAttributeChange: (card.mainAttributeChange ?? 0) + behemothUpgrades,
			});
		}
		return card;
	});
};
