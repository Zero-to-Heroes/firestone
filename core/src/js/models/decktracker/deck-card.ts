import { CardMetaInfo } from './card-meta-info';

export class DeckCard {
	readonly cardId: string;
	readonly entityId: number;
	readonly cardName: string;
	readonly manaCost: number;
	readonly rarity: string;
	readonly creatorCardId?: string;
	readonly lastAffectedByCardId?: string;
	readonly buffingEntityCardIds?: readonly string[];
	// readonly totalQuantity: number;
	// Optional, should only be read when in the Other zone
	readonly zone:
		| 'DISCARD'
		| 'BURNED'
		| 'PLAY'
		| 'SETASIDE'
		| 'SECRET'
		| 'HAND'
		| 'REMOVEDFROMGAME'
		| 'GRAVEYARD'
		| 'TRANSFORMED_INTO_OTHER';
	readonly metaInfo: CardMetaInfo = new CardMetaInfo();
	readonly inInitialDeck: boolean;
	readonly temporaryCard?: boolean;

	public static create(base: DeckCard = {} as DeckCard) {
		if (base.cardId && !base.cardName) {
			console.warn('creating deck card without name', base, new Error().stack);
		}
		return Object.assign(new DeckCard(), base);
	}

	protected constructor() {
		// Protected to force call to static factory
	}

	public update(newCard: DeckCard): DeckCard {
		if (newCard.cardId && !newCard.cardName) {
			console.warn('updating deck card without name', newCard, new Error().stack);
		}
		return Object.assign(new DeckCard(), this, newCard);
	}

	public isFiller(): boolean {
		return !this.cardId && !this.entityId && !this.creatorCardId && !this.cardName;
	}
}
