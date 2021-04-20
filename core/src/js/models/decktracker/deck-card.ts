import { ReferenceCard } from '@firestone-hs/reference-data/lib/models/reference-cards/reference-card';
import { CardMetaInfo } from './card-meta-info';

export class DeckCard {
	readonly cardId: string;
	readonly entityId: number;
	readonly cardName: string;
	readonly manaCost: number;
	// So that when only the type of the card is known (like after Deck of Lunacy)
	// we can still apply type-specific effects on it
	readonly cardType: string;
	// Some cards change the cost of a card, this field will reflect it
	// For now still only implementing a few effects, like Incanter's Flow
	readonly actualManaCost: number;
	readonly rarity: string;
	readonly creatorCardId?: string;
	readonly lastAffectedByCardId?: string;
	readonly dormant?: boolean;
	readonly buffingEntityCardIds?: readonly string[];
	readonly buffCardIds?: readonly string[];
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
	readonly cardMatchCondition?: (card: ReferenceCard) => boolean;

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
		if (newCard?.cardId && !newCard?.cardName) {
			console.warn('updating deck card without name', newCard, new Error().stack);
		}
		return Object.assign(new DeckCard(), this, newCard);
	}

	public isFiller(): boolean {
		return !this.cardId && !this.entityId && !this.creatorCardId && !this.cardName;
	}

	public getEffectiveManaCost(): number {
		return this.actualManaCost ?? this.manaCost;
	}
}
