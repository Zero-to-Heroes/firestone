import { DeckCard } from '../deck-card';

export class DynamicZone {
	readonly id: string;
	readonly name: string;
	readonly cards: readonly DeckCard[];
}
