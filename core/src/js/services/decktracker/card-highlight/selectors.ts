import { CardClass, CardType, Race, SpellSchool } from '@firestone-hs/reference-data';
import { DeckState } from '../../../models/decktracker/deck-state';
import { Handler } from './cards-highlight.service';

export const and = (
	...filters: ((h: Handler, d?: DeckState) => boolean)[]
): ((handler: Handler, d?: DeckState) => boolean) => {
	return (handler, deckState) => filters.every((filter) => filter(handler, deckState));
};

export const or = (
	...filters: ((h: Handler, d?: DeckState) => boolean)[]
): ((handler: Handler, d?: DeckState) => boolean) => {
	return (handler, deckState) => filters.some((filter) => filter(handler, deckState));
};

export const not = (filter: (h: Handler, d?: DeckState) => boolean): ((handler: Handler, d?: DeckState) => boolean) => {
	return (handler, deckState) => !filter(handler, deckState);
};

export const inDeck = (handler: Handler): boolean => {
	return handler.zoneProvider()?.id === 'deck';
};

export const inHand = (handler: Handler): boolean => {
	return handler.zoneProvider()?.id === 'hand';
};

export const inOther = (handler: Handler): boolean => {
	return handler.zoneProvider()?.id === 'other';
};

export const inGraveyard = (handler: Handler): boolean => {
	return handler.deckCardProvider()?.zone === 'GRAVEYARD';
};

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

export const spellPlayedThisMatch = (handler: Handler, deckState: DeckState): boolean => {
	return deckState?.spellsPlayedThisMatch
		.map((spell) => spell.entityId)
		.includes(handler.deckCardProvider()?.entityId);
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
