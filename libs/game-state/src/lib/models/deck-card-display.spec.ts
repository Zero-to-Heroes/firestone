import { CardIds } from '@firestone-hs/reference-data';
import { DeckCard } from './deck-card';
import { getDisplayCardIdWhenGuessedPoolIsSingleCard } from './deck-card-display';

describe('getDisplayCardIdWhenGuessedPoolIsSingleCard', () => {
	it('returns the only possible card id when cardId is empty and pool has one entry', () => {
		const card = DeckCard.create({
			cardId: '',
			entityId: 42,
			guessedInfo: { possibleCards: [CardIds.TheCoinCore] },
		});
		expect(getDisplayCardIdWhenGuessedPoolIsSingleCard(card)).toBe(CardIds.TheCoinCore);
	});

	it('returns null when cardId is already set', () => {
		const card = DeckCard.create({
			cardId: CardIds.TheCoinCore,
			entityId: 42,
			guessedInfo: { possibleCards: [CardIds.TheCoinCore] },
		});
		expect(getDisplayCardIdWhenGuessedPoolIsSingleCard(card)).toBeNull();
	});

	it('returns null when pool is empty or has multiple cards', () => {
		expect(
			getDisplayCardIdWhenGuessedPoolIsSingleCard(
				DeckCard.create({ cardId: '', entityId: 1, guessedInfo: { possibleCards: [] } }),
			),
		).toBeNull();
		expect(
			getDisplayCardIdWhenGuessedPoolIsSingleCard(
				DeckCard.create({
					cardId: '',
					entityId: 1,
					guessedInfo: { possibleCards: [CardIds.TheCoinCore, CardIds.InnervateCore] },
				}),
			),
		).toBeNull();
	});

	it('returns null for Godfrey-returned cards even when the burned pool has one card left', () => {
		expect(
			getDisplayCardIdWhenGuessedPoolIsSingleCard(
				DeckCard.create({
					cardId: '',
					entityId: 136,
					creatorCardId: CardIds.GodfreyTheBetrayer_GodfreysAtlasEnchantment_JAIL_509e,
					guessedInfo: { possibleCards: [CardIds.LotusBookie_JAIL_720] },
				}),
			),
		).toBeNull();
	});
});
