import { DeckCard } from './deck-card';
import { DeckState } from './deck-state';

describe('DeckState.getAllCardsFromStarterDeck', () => {
	function card(overrides: Partial<{ cardId: string; entityId: number; creatorCardId: string; stolenFromOpponent: boolean; temporaryCard: boolean }>): DeckCard {
		return DeckCard.create(overrides);
	}

	it('should return deckList directly when it is non-empty', () => {
		const deckListCards = [
			card({ cardId: 'CARD_A', entityId: 0 }),
			card({ cardId: 'CARD_B', entityId: 0 }),
		];
		const state = DeckState.create({
			deckList: deckListCards,
			hand: [card({ cardId: 'CARD_A', entityId: 101 })],
			board: [card({ cardId: 'CARD_B', entityId: 102 })],
			otherZone: [],
			deck: [],
		});

		const result = state.getAllCardsFromStarterDeck();
		expect(result.length).toBe(2);
		expect(result.map((c) => c.cardId)).toEqual(['CARD_A', 'CARD_B']);
	});

	it('should not double-count cards when deckList is populated and cards are in zones', () => {
		// Simulate: deckList has 4 cards, and those same cards are spread across zones
		const deckListCards = [
			card({ cardId: 'CARD_A', entityId: 0 }),
			card({ cardId: 'CARD_A', entityId: 0 }),
			card({ cardId: 'CARD_B', entityId: 0 }),
			card({ cardId: 'CARD_C', entityId: 0 }),
		];
		const state = DeckState.create({
			deckList: deckListCards,
			hand: [card({ cardId: 'CARD_A', entityId: 101 })],
			deck: [],
			board: [card({ cardId: 'CARD_B', entityId: 102 })],
			otherZone: [
				card({ cardId: 'CARD_A', entityId: 103 }),
				card({ cardId: 'CARD_C', entityId: 104 }),
			],
		});

		const result = state.getAllCardsFromStarterDeck();
		// Should return exactly the 4 cards from deckList, not 4 + 4 = 8
		expect(result.length).toBe(4);
	});

	it('should reconstruct from zones when deckList is empty (unknown opponent)', () => {
		const state = DeckState.create({
			deckList: [],
			hand: [card({ cardId: 'CARD_A', entityId: 101 })],
			deck: [card({ cardId: 'CARD_B', entityId: 102 })],
			board: [card({ cardId: 'CARD_C', entityId: 103 })],
			otherZone: [card({ cardId: 'CARD_D', entityId: 104 })],
		});

		const result = state.getAllCardsFromStarterDeck();
		expect(result.length).toBe(4);
		expect(result.map((c) => c.cardId).sort()).toEqual(['CARD_A', 'CARD_B', 'CARD_C', 'CARD_D']);
	});

	it('should exclude created cards when reconstructing from zones', () => {
		const state = DeckState.create({
			deckList: [],
			hand: [card({ cardId: 'CARD_A', entityId: 101 })],
			deck: [],
			board: [card({ cardId: 'CARD_B', entityId: 102, creatorCardId: 'SOME_SPELL' })],
			otherZone: [card({ cardId: 'CARD_C', entityId: 103 })],
		});

		const result = state.getAllCardsFromStarterDeck();
		expect(result.length).toBe(2);
		expect(result.map((c) => c.cardId).sort()).toEqual(['CARD_A', 'CARD_C']);
	});

	it('should exclude stolen cards when reconstructing from zones', () => {
		const state = DeckState.create({
			deckList: [],
			hand: [card({ cardId: 'CARD_A', entityId: 101 })],
			deck: [],
			board: [card({ cardId: 'CARD_B', entityId: 102, stolenFromOpponent: true })],
			otherZone: [card({ cardId: 'CARD_C', entityId: 103 })],
		});

		const result = state.getAllCardsFromStarterDeck();
		expect(result.length).toBe(2);
		expect(result.map((c) => c.cardId).sort()).toEqual(['CARD_A', 'CARD_C']);
	});

	it('should exclude temporary cards when reconstructing from zones', () => {
		const state = DeckState.create({
			deckList: [],
			hand: [card({ cardId: 'CARD_A', entityId: 101 })],
			deck: [],
			board: [card({ cardId: 'CARD_B', entityId: 102, temporaryCard: true })],
			otherZone: [card({ cardId: 'CARD_C', entityId: 103 })],
		});

		const result = state.getAllCardsFromStarterDeck();
		expect(result.length).toBe(2);
		expect(result.map((c) => c.cardId).sort()).toEqual(['CARD_A', 'CARD_C']);
	});

	it('should deduplicate by entityId when reconstructing from zones', () => {
		// Same card entity appears in multiple zones (edge case / tracking bug)
		const state = DeckState.create({
			deckList: [],
			hand: [card({ cardId: 'CARD_A', entityId: 101 })],
			deck: [],
			board: [],
			otherZone: [card({ cardId: 'CARD_A', entityId: 101 })],
		});

		const result = state.getAllCardsFromStarterDeck();
		expect(result.length).toBe(1);
		expect(result[0].cardId).toBe('CARD_A');
	});
});
