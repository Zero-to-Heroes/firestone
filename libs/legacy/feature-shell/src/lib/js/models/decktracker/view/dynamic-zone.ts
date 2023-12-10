import { DeckCard } from '@firestone/game-state';

export class DynamicZone {
	readonly id: string;
	readonly name: string;
	readonly cards: readonly DeckCard[];
}
