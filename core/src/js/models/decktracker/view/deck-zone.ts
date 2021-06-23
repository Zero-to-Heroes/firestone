import { VisualDeckCard } from '../visual-deck-card';

export interface DeckZone {
	readonly id: 'deck' | 'hand' | 'other' | string;
	readonly name: string;
	readonly cards: readonly VisualDeckCard[];
	readonly numberOfCards: number;
	readonly showWarning?: boolean;
	readonly sortingFunction: (a: VisualDeckCard, b: VisualDeckCard) => number;
}
