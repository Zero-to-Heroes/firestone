import { VisualDeckCard } from '../visual-deck-card';

export interface DeckZone {
	readonly id: string;
	readonly name: string;
	readonly cards: readonly VisualDeckCard[];
	readonly sortingFunction: (a: VisualDeckCard, b: VisualDeckCard) => number;
}
