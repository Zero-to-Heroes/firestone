import { CardType, Race, SpellSchool } from '@firestone-hs/reference-data';
import { Handler } from './cards-highlight.service';

export const doubleJump: (handler: Handler) => boolean = (handler: Handler): boolean => {
	return handler.zoneProvider()?.id === 'deck' && hasOutcast(handler);
};

export const tuskpiercer: (handler: Handler) => boolean = (handler: Handler): boolean => {
	return handler.zoneProvider()?.id === 'deck' && hasDeathrattle(handler);
};

export const lineHopper: (handler: Handler) => boolean = (handler: Handler): boolean => {
	return hasOutcast(handler);
};

export const livingSeed: (handler: Handler) => boolean = (handler: Handler): boolean => {
	return handler.zoneProvider()?.id === 'deck' && handler.referenceCardProvider()?.race === Race[Race.BEAST];
};

export const murlocsInDeckAndHand: (handler: Handler) => boolean = (handler: Handler): boolean => {
	return (
		(handler.zoneProvider()?.id === 'deck' || handler.zoneProvider()?.id === 'hand') &&
		handler.referenceCardProvider()?.race === Race[Race.MURLOC]
	);
};

export const fungalFortunes: (handler: Handler) => boolean = (handler: Handler): boolean => {
	return handler.zoneProvider()?.id === 'deck' && hasType(handler, CardType.MINION);
};

export const guffRunetotem: (handler: Handler) => boolean = (handler: Handler): boolean => {
	return (
		hasType(handler, CardType.SPELL) &&
		handler.referenceCardProvider()?.spellSchool === SpellSchool[SpellSchool.NATURE]
	);
};

export const knightOfAnointment: (handler: Handler) => boolean = (handler: Handler): boolean => {
	return (
		handler.zoneProvider()?.id === 'deck' &&
		hasType(handler, CardType.SPELL) &&
		handler.referenceCardProvider()?.spellSchool === SpellSchool[SpellSchool.HOLY]
	);
};

export const guardianAnimals: (handler: Handler) => boolean = (handler: Handler): boolean => {
	return (
		handler.zoneProvider()?.id === 'deck' &&
		hasType(handler, CardType.MINION) &&
		handler.referenceCardProvider()?.race === Race[Race.BEAST] &&
		handler.deckCardProvider()?.getEffectiveManaCost() <= 5
	);
};

export const barakKodobane: (handler: Handler) => boolean = (handler: Handler): boolean => {
	return (
		handler.zoneProvider()?.id === 'deck' &&
		hasType(handler, CardType.SPELL) &&
		handler.deckCardProvider()?.getEffectiveManaCost() <= 3 &&
		handler.deckCardProvider()?.getEffectiveManaCost() > 0
	);
};

export const jewelOfNzoth: (handler: Handler) => boolean = (handler: Handler): boolean => {
	return (
		handler.zoneProvider()?.id === 'other' &&
		hasType(handler, CardType.MINION) &&
		handler.deckCardProvider()?.zone === 'GRAVEYARD' &&
		hasDeathrattle(handler)
	);
};

export const overlordSaurfang: (handler: Handler) => boolean = (handler: Handler): boolean => {
	return (
		handler.zoneProvider()?.id === 'other' &&
		handler.deckCardProvider()?.zone === 'GRAVEYARD' &&
		hasType(handler, CardType.MINION) &&
		hasFrenzy(handler)
	);
};

export const rally: (handler: Handler) => boolean = (handler: Handler): boolean => {
	return (
		handler.zoneProvider()?.id === 'other' &&
		hasType(handler, CardType.MINION) &&
		handler.deckCardProvider()?.zone === 'GRAVEYARD' &&
		[1, 2, 3].includes(handler.deckCardProvider().manaCost)
	);
};

export const arcanologist: (handler: Handler) => boolean = (handler: Handler): boolean => {
	return handler.zoneProvider()?.id === 'deck' && hasType(handler, CardType.SPELL) && isSecret(handler);
};

export const darkInquisitorXanesh: (handler: Handler) => boolean = (handler: Handler): boolean => {
	return (
		(handler.zoneProvider()?.id === 'deck' || handler.zoneProvider()?.id === 'hand') &&
		(hasCorrupt(handler) || isCorrupted(handler))
	);
};

export const cagematchCustodian: (handler: Handler) => boolean = (handler: Handler): boolean => {
	return handler.zoneProvider()?.id === 'deck' && hasType(handler, CardType.WEAPON);
};

export const ringmasterWhatley: (handler: Handler) => boolean = (handler: Handler): boolean => {
	return (
		handler.zoneProvider()?.id === 'deck' &&
		hasType(handler, CardType.MINION) &&
		[Race[Race.DRAGON], Race[Race.MECH], Race[Race.PIRATE]].includes(handler.referenceCardProvider()?.race)
	);
};

export const arcaneLuminary: (handler: Handler) => boolean = (handler: Handler): boolean => {
	return (
		handler.zoneProvider()?.id === 'deck' &&
		(handler.deckCardProvider().creatorCardId != null || handler.deckCardProvider().creatorCardIds?.length > 0)
	);
};

export const redscaleDragontamer: (handler: Handler) => boolean = (handler: Handler): boolean => {
	return handler.zoneProvider()?.id === 'deck' && handler.referenceCardProvider()?.race === Race[Race.DRAGON];
};

const hasType = (handler: Handler, type: CardType): boolean => {
	return (
		handler.deckCardProvider()?.cardType?.toLowerCase() === CardType[type].toLowerCase() ||
		handler.referenceCardProvider()?.type?.toLowerCase() === CardType[type].toLowerCase()
	);
};

const hasOutcast = (handler: Handler): boolean => {
	return (handler.referenceCardProvider()?.mechanics ?? []).includes('OUTCAST');
};

const hasDeathrattle = (handler: Handler): boolean => {
	return (handler.referenceCardProvider()?.mechanics ?? []).includes('DEATHRATTLE');
};

const hasFrenzy = (handler: Handler): boolean => {
	return (handler.referenceCardProvider()?.mechanics ?? []).includes('FRENZY');
};

const hasCorrupt = (handler: Handler): boolean => {
	return (handler.referenceCardProvider()?.mechanics ?? []).includes('CORRUPT');
};

const isCorrupted = (handler: Handler): boolean => {
	return (handler.referenceCardProvider()?.mechanics ?? []).includes('CORRUPTED');
};

const isSecret = (handler: Handler): boolean => {
	return (handler.referenceCardProvider()?.mechanics ?? []).includes('SECRET');
};
