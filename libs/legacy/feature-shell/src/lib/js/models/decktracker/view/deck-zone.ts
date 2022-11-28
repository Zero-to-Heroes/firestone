import { VisualDeckCard } from '../visual-deck-card';

export interface DeckZone {
	readonly id: 'deck' | 'hand' | 'other' | string;
	readonly name: string;
	// readonly cards: readonly VisualDeckCard[];
	readonly sections: readonly DeckZoneSection[];
	readonly numberOfCards: number;
	readonly showWarning?: boolean;
}

export interface DeckZoneSection {
	readonly header: string;
	readonly cards: readonly VisualDeckCard[];
	readonly sortingFunction: (a: VisualDeckCard, b: VisualDeckCard) => number;
}
