import { DeckCard } from './deck-card';

export class VisualDeckCard extends DeckCard {
	readonly highlight: 'dim' | 'normal' | 'in-hand';
	readonly cardClass?: string;
	readonly totalQuantity: number;
	readonly creatorCardIds?: readonly string[] = [];
	readonly lastAffectedByCardIds?: readonly string[] = [];

	constructor() {
		super();
	}
}
