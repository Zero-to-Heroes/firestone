import { NonFunctionProperties } from '@services/utils';
import { DeckCard } from './deck-card';

export class VisualDeckCard extends DeckCard {
	readonly highlight: 'dim' | 'normal' | 'in-hand';
	readonly cardClass?: string;
	readonly totalQuantity: number;
	readonly creatorCardIds?: readonly string[] = [];
	readonly lastAffectedByCardIds?: readonly string[] = [];
	readonly isMissing?: boolean;

	constructor() {
		super();
	}

	public static create(base: Partial<NonFunctionProperties<VisualDeckCard>> = {} as VisualDeckCard): VisualDeckCard {
		// if (base.cardId && !base.cardName) {
		// 	console.warn('creating deck card without name', base, new Error().stack);
		// }
		return Object.assign(new VisualDeckCard(), base);
	}
}
