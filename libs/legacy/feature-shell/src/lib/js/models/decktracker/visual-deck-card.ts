import { CardClass } from '@firestone-hs/reference-data';
import { NonFunctionProperties } from '@firestone/shared/framework/common';
import { DeckCard } from './deck-card';

export class VisualDeckCard extends DeckCard {
	readonly highlight: 'dim' | 'normal' | 'in-hand';
	readonly internalEntityIds: readonly string[];
	readonly classes?: readonly CardClass[];
	readonly totalQuantity: number;
	readonly creatorCardIds?: readonly string[] = [];
	readonly lastAffectedByCardIds?: readonly string[] = [];
	readonly isMissing?: boolean;

	protected constructor() {
		super();
	}

	public static create(base: Partial<NonFunctionProperties<VisualDeckCard>> = {} as VisualDeckCard): VisualDeckCard {
		// if (base.cardId && !base.cardName) {
		// 	console.warn('creating deck card without name', base, new Error().stack);
		// }
		return Object.assign(new VisualDeckCard(), base);
	}

	public update(base: Partial<NonFunctionProperties<VisualDeckCard>>): VisualDeckCard {
		return Object.assign(new VisualDeckCard(), this, base);
	}
}
