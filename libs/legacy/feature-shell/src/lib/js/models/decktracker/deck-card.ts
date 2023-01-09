import { ReferenceCard } from '@firestone-hs/reference-data';
import { NonFunctionProperties } from '@services/utils';
import { CardMetaInfo } from './card-meta-info';

export class DeckCard {
	public static deckIndexFromBottom = 0;

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
	readonly lastAffectedByEntityId?: number;
	readonly dormant?: boolean;
	// Put into play is different from "played", which is important in the case of cards like
	// the Duels Tomb Divers, or Tess / Contraband Stash
	readonly putIntoPlay?: boolean;
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
	readonly stolenFromOpponent?: boolean;
	readonly temporaryCard?: boolean;
	// Not sure exactly what the best way is to show the milled cards. As far as HS is concerned, the
	// "milled" status doesn't exist, so we need a special flag
	readonly milled?: boolean;
	readonly countered?: boolean;
	// Store state for cards like Ignite. Similar state info will be added for attack / health (maybe
	// other things too)
	readonly mainAttributeChange?: number;
	readonly playTiming?: number;
	readonly positionFromBottom?: number;
	readonly positionFromTop?: number;
	readonly dredged?: boolean;
	readonly createdByJoust?: boolean;
	readonly linkedEntityIds?: readonly number[] = [];
	readonly relatedCardIds?: readonly string[] = [];
	// When an entity is "copied from" another entity, the game logs store the link only one way.
	// This can be used to store the link in both ways, when we know about it
	readonly cardCopyLink?: number;
	readonly cardMatchCondition?: (card: ReferenceCard, cardInfos?: { cost?: number }) => boolean;

	public static create(base: Partial<NonFunctionProperties<DeckCard>> = {} as DeckCard) {
		// if (base.cardId && !base.cardName) {
		// console.warn('creating deck card without name', base, new Error().stack);
		// }
		return Object.assign(new DeckCard(), base);
	}

	protected constructor() {
		// Protected to force call to static factory
	}

	public update(newCard: Partial<NonFunctionProperties<DeckCard>>): DeckCard {
		if (!newCard) {
			return this;
		}

		// Don't log anything, as this can cause some huge lag on new releases, when the cards are not updated yet
		if (newCard?.cardId && !newCard?.cardName) {
			// console.warn('updating deck card without name', newCard, newCard?.cardId, new Error().stack);
		}
		return Object.assign(new DeckCard(), this, newCard);
	}

	public isFiller(): boolean {
		return !this.cardId && !this.entityId && !this.creatorCardId && !this.cardName;
	}

	public getEffectiveManaCost(): number {
		// Because it's used in grouping keys, and we don't want to differentiate null and undefined in that case
		return this.actualManaCost ?? this.manaCost ?? null;
	}
}
