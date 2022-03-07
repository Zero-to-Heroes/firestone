import { CardClass, CardType, GameTag, Race, RarityTYpe, SpellSchool } from '@firestone-hs/reference-data';
import { DeckState } from '../../../models/decktracker/deck-state';
import { Handler, SelectorOptions } from './cards-highlight.service';

export const and = (
	...filters: ((h: Handler, d?: DeckState, options?: SelectorOptions) => boolean)[]
): ((handler: Handler, d?: DeckState, options?: SelectorOptions) => boolean) => {
	return (handler, deckState, options?: SelectorOptions) =>
		filters.every((filter) => filter(handler, deckState, options));
};

export const or = (
	...filters: ((h: Handler, d?: DeckState, options?: SelectorOptions) => boolean)[]
): ((handler: Handler, d?: DeckState, options?: SelectorOptions) => boolean) => {
	return (handler, deckState, options?: SelectorOptions) =>
		filters.some((filter) => filter(handler, deckState, options));
};

export const not = (
	filter: (h: Handler, d?: DeckState, options?: SelectorOptions) => boolean,
): ((handler: Handler, d?: DeckState, options?: SelectorOptions) => boolean) => {
	return (handler, deckState, options?: SelectorOptions) => !filter(handler, deckState, options);
};

const inZoneId = (zone: string) => (handler: Handler, d?: DeckState, options?: SelectorOptions): boolean =>
	options?.uniqueZone || handler.zoneProvider()?.id?.toLowerCase() === zone?.toLowerCase();
const inZoneName = (zone: string) => (handler: Handler, d?: DeckState, options?: SelectorOptions): boolean =>
	handler.deckCardProvider()?.zone?.toLowerCase() === zone?.toLowerCase();
export const inDeck = inZoneId('deck');
export const inHand = inZoneId('hand');
export const inOther = inZoneId('other');
export const inGraveyard = inZoneName('GRAVEYARD');

export const effectiveCostLess = (cost: number) => (handler: Handler): boolean => {
	return handler.deckCardProvider()?.getEffectiveManaCost() < cost;
};

export const effectiveCostMore = (cost: number) => (handler: Handler): boolean => {
	return handler.deckCardProvider()?.getEffectiveManaCost() > cost;
};

export const effectiveCostEqual = (cost: number) => (handler: Handler): boolean => {
	return handler.deckCardProvider()?.getEffectiveManaCost() === cost;
};

export const notInInitialDeck = (handler: Handler): boolean => {
	return handler.deckCardProvider().creatorCardId != null || handler.deckCardProvider().creatorCardIds?.length > 0;
};

export const spellPlayedThisMatch = (handler: Handler, deckState: DeckState, options?: SelectorOptions): boolean => {
	return deckState?.spellsPlayedThisMatch
		.map((spell) => spell.entityId)
		.includes(handler.deckCardProvider()?.entityId);
};

const hasMechanic = (mechanic: GameTag) => (handler: Handler): boolean =>
	(handler.referenceCardProvider()?.mechanics ?? []).includes(GameTag[mechanic]);
// export const overload = hasMechanic(GameTag.OVERLOAD);

export const overload = (handler: Handler): boolean => {
	return (handler.referenceCardProvider()?.mechanics ?? []).includes('OVERLOAD');
};

export const outcast = (handler: Handler): boolean => {
	return (handler.referenceCardProvider()?.mechanics ?? []).includes('OUTCAST');
};

export const deathrattle = (handler: Handler): boolean => {
	return (handler.referenceCardProvider()?.mechanics ?? []).includes('DEATHRATTLE');
};

export const frenzy = (handler: Handler): boolean => {
	return (handler.referenceCardProvider()?.mechanics ?? []).includes('FRENZY');
};

export const corrupt = (handler: Handler): boolean => {
	return (handler.referenceCardProvider()?.mechanics ?? []).includes('CORRUPT');
};

export const rush = (handler: Handler): boolean => {
	return (handler.referenceCardProvider()?.mechanics ?? []).includes('RUSH');
};

export const taunt = (handler: Handler): boolean => {
	return (handler.referenceCardProvider()?.mechanics ?? []).includes('TAUNT');
};

export const divineShield = (handler: Handler): boolean => {
	return (handler.referenceCardProvider()?.mechanics ?? []).includes('DIVINE_SHIELD');
};

export const corrupted = (handler: Handler): boolean => {
	return (handler.referenceCardProvider()?.mechanics ?? []).includes('CORRUPTED');
};

export const secret = (handler: Handler): boolean => {
	return (handler.referenceCardProvider()?.mechanics ?? []).includes('SECRET');
};

export const spellSchool = (spellSchool: SpellSchool) => (handler: Handler): boolean => {
	return handler.referenceCardProvider()?.spellSchool === SpellSchool[spellSchool];
};
export const shadow = spellSchool(SpellSchool.SHADOW);
export const fel = spellSchool(SpellSchool.FEL);
export const holy = spellSchool(SpellSchool.HOLY);
export const frost = spellSchool(SpellSchool.FROST);

export const cardType = (type: CardType) => (handler: Handler): boolean => {
	return (
		handler.deckCardProvider()?.cardType?.toLowerCase() === CardType[type].toLowerCase() ||
		handler.referenceCardProvider()?.type?.toLowerCase() === CardType[type].toLowerCase()
	);
};
export const minion = cardType(CardType.MINION);
export const spell = cardType(CardType.SPELL);
export const weapon = cardType(CardType.WEAPON);

export const race = (race: Race) => (handler: Handler): boolean => {
	return handler.referenceCardProvider()?.race === Race[race];
};
export const beast = race(Race.BEAST);
export const demon = race(Race.DEMON);
export const dragon = race(Race.DRAGON);
export const mech = race(Race.MECH);
export const pirate = race(Race.PIRATE);

export const cardClass = (cardClass: CardClass) => (handler: Handler): boolean => {
	return handler.referenceCardProvider()?.cardClass === CardClass[cardClass];
};
export const rogue = cardClass(CardClass.ROGUE);

export const rarity = (rarity: RarityTYpe) => (handler: Handler): boolean => {
	return handler.referenceCardProvider()?.rarity?.toLowerCase() === rarity?.toLowerCase();
};
export const legendary = rarity('Legendary');
