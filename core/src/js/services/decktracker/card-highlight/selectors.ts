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
		filters.filter((f) => !!f).some((filter) => filter(handler, deckState, options));
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
export const inDeck = or(inZoneId('deck'), inZoneId('deck-top'), inZoneId('deck-bottom'));
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

export const healthBiggerThanAttack = (handler: Handler): boolean => {
	return handler.referenceCardProvider().health > handler.referenceCardProvider().attack;
};

export const spellPlayedThisMatch = (handler: Handler, deckState: DeckState, options?: SelectorOptions): boolean => {
	return deckState?.spellsPlayedThisMatch
		.map((spell) => spell.entityId)
		.includes(handler.deckCardProvider()?.entityId);
};
export const cardsPlayedThisMatch = (handler: Handler, deckState: DeckState, options?: SelectorOptions): boolean => {
	return deckState?.cardsPlayedThisMatch.map((card) => card.entityId).includes(handler.deckCardProvider()?.entityId);
};

const hasMechanic = (mechanic: GameTag) => (handler: Handler): boolean =>
	(handler.referenceCardProvider()?.mechanics ?? []).includes(GameTag[mechanic]);
export const battlecry = hasMechanic(GameTag.BATTLECRY);
export const corrupt = hasMechanic(GameTag.CORRUPT);
export const corrupted = hasMechanic(GameTag.CORRUPTED);
export const deathrattle = hasMechanic(GameTag.DEATHRATTLE);
export const discover = hasMechanic(GameTag.DISCOVER);
export const divineShield = hasMechanic(GameTag.DIVINE_SHIELD);
export const freeze = hasMechanic(GameTag.FREEZE);
export const frenzy = hasMechanic(GameTag.FRENZY);
export const magnetic = hasMechanic(GameTag.MODULAR);
export const outcast = hasMechanic(GameTag.OUTCAST);
export const overload = hasMechanic(GameTag.OVERLOAD);
export const rush = hasMechanic(GameTag.RUSH);
export const secret = hasMechanic(GameTag.SECRET);
export const taunt = hasMechanic(GameTag.TAUNT);
export const dredge = hasMechanic(GameTag.DREDGE);

export const spellSchool = (spellSchool: SpellSchool) => (handler: Handler): boolean => {
	return handler.referenceCardProvider()?.spellSchool === SpellSchool[spellSchool];
};
export const arcane = spellSchool(SpellSchool.ARCANE);
export const fel = spellSchool(SpellSchool.FEL);
export const fire = spellSchool(SpellSchool.FIRE);
export const frost = spellSchool(SpellSchool.FROST);
export const holy = spellSchool(SpellSchool.HOLY);
export const nature = spellSchool(SpellSchool.NATURE);
export const shadow = spellSchool(SpellSchool.SHADOW);
export const hasSpellSchool = (handler: Handler): boolean => {
	return !!handler.referenceCardProvider()?.spellSchool;
};

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
export const murloc = race(Race.MURLOC);
export const naga = race(Race.NAGA);
export const pirate = race(Race.PIRATE);

export const cardClass = (cardClass: CardClass) => (handler: Handler): boolean => {
	return handler.referenceCardProvider()?.cardClass === CardClass[cardClass];
};
export const neutral = cardClass(CardClass.NEUTRAL);
export const rogue = cardClass(CardClass.ROGUE);

export const rarity = (rarity: RarityTYpe) => (handler: Handler): boolean => {
	return handler.referenceCardProvider()?.rarity?.toLowerCase() === rarity?.toLowerCase();
};
export const legendary = rarity('Legendary');

// TODO: implement it
export const damage = (handler: Handler): boolean => {
	return true;
};
