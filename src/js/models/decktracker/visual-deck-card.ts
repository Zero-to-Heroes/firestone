import { DeckCard } from './deck-card';

export class VisualDeckCard extends DeckCard {
	readonly highlight: 'dim' | 'normal' | 'in-hand';
	readonly totalQuantity: number;
	readonly creatorCardIds?: readonly string[];
}
