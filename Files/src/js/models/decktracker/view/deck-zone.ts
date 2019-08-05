import { DeckCard } from '../deck-card';

export interface DeckZone {
	readonly id: string;
	readonly name: string;
	readonly cards: readonly DeckCard[];
	readonly sortingFunction: (a: DeckCard, b: DeckCard) => number;
}
