import { GameTag, ReferenceCard, SpellSchool } from '@firestone-hs/reference-data';
import { NonFunctionProperties, uuidShort } from '@firestone/shared/framework/common';
import { CardMetaInfo } from './card-meta-info';

export class DeckCard {
	public static deckIndexFromBottom = 0;
	public static deckIndexFromTop = 0;

	readonly cardId: string;
	readonly internalEntityId: string;
	readonly entityId: number;
	readonly cardName: string;
	// The reference mana cost of the card, as it is in the reference data
	readonly refManaCost: number;
	// Some cards change the cost of a card, this field will reflect it
	// For now still only implementing a few effects, like Incanter's Flow
	readonly actualManaCost: number;
	// So that when only the type of the card is known (like after Deck of Lunacy)
	// we can still apply type-specific effects on it
	readonly cardType: string;
	readonly rarity: string;
	readonly creatorCardId?: string;
	readonly creatorEntityId?: number;
	readonly lastAffectedByCardId?: string;
	readonly lastAffectedByEntityId?: number;
	readonly dormant?: boolean;
	// Put into play is different from "played", which is important in the case of cards like
	// Tess / Contraband Stash
	readonly putIntoPlay?: boolean;
	readonly buffingEntityCardIds?: readonly string[];
	readonly buffCardIds?: readonly string[];
	readonly transformedInto?: string;
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
	readonly turnsUntilImmolate?: number;
	readonly playTiming?: number;
	readonly positionFromBottom?: number;
	readonly positionFromTop?: number;
	readonly dredged?: boolean;
	readonly forged: number = 0;
	readonly createdByJoust?: boolean;
	readonly linkedEntityIds?: readonly number[] = [];
	readonly relatedCardIds?: readonly string[] = [];
	readonly creatorAdditionalInfo?: any;
	// When an entity is "copied from" another entity, the game logs store the link only one way.
	// This can be used to store the link in both ways, when we know about it
	readonly cardCopyLink?: number;
	readonly storedInformation?: StoredInformation | null;
	readonly guessedInfo: GuessedInfo = {};
	// readonly tags: readonly { Name: number; Value: number }[] = [];
	readonly tags: { [Name in GameTag]?: number } = {};
	readonly cardMatchCondition?: (card: ReferenceCard, cardInfos?: { cost?: number }) => boolean;

	public static create(base: Partial<NonFunctionProperties<DeckCard>> = {} as DeckCard) {
		// if (base.cardId && !base.cardName) {
		// console.warn('creating deck card without name', base, new Error().stack);
		// }
		return Object.assign(
			new DeckCard(),
			{
				internalEntityId: uuidShort(),
			},
			base,
		);
	}

	protected constructor() {
		// Protected to force call to static factory
	}

	public update(newCard: Partial<NonFunctionProperties<DeckCard>>): DeckCard {
		return Object.assign(new DeckCard(), this, newCard);
	}

	public isFiller(): boolean {
		return !this.cardId && !this.entityId && !this.creatorCardId && !this.cardName;
	}

	public getEffectiveManaCost(): number {
		return this.actualManaCost ?? this.refManaCost ?? null;
	}
}

export interface StoredInformation {
	// WARNING: not sure this is a good idea to not make the values read-only, but it makes it SO much
	// easier to work with
	tagScriptValues?: (number | null)[];
	cards?: readonly { cardId: string; entityId: number }[];
}

export interface GuessedInfo {
	readonly cost?: number | null;
	readonly attackBuff?: number | null;
	readonly healthBuff?: number | null;
	readonly possibleCards?: readonly string[] | null;
	readonly spellSchools?: readonly SpellSchool[] | null;
}

export const toTagsObject = (inputTags: readonly { Name: number; Value: number }[]): { [Name in GameTag]?: number } => {
	return (inputTags ?? []).reduce((acc, tag) => {
		acc[tag.Name] = tag.Value;
		return acc;
	}, {} as { [Name in GameTag]?: number });
};
