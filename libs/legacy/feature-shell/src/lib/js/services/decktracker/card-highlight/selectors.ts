import { getSi7Locale } from '@components/game-counters/definitions/si7-counter';
import {
	CardClass,
	CardIds,
	CardType,
	GameTag,
	Locale,
	Race,
	RarityTYpe,
	SpellSchool,
} from '@firestone-hs/reference-data';
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

const inZoneId =
	(zone: string) =>
	(handler: Handler, d?: DeckState, options?: SelectorOptions): boolean =>
		options?.uniqueZone || handler.zoneProvider()?.id?.toLowerCase() === zone?.toLowerCase();
const inZoneName =
	(zone: string) =>
	(handler: Handler, d?: DeckState, options?: SelectorOptions): boolean =>
		handler.deckCardProvider()?.zone?.toLowerCase() === zone?.toLowerCase();
export const inDeck = or(inZoneId('deck'), inZoneId('deck-top'), inZoneId('deck-bottom'));
export const inHand = inZoneId('hand');
export const inOther = inZoneId('other');
export const inGraveyard = inZoneName('GRAVEYARD');

export const effectiveCostLess =
	(cost: number) =>
	(handler: Handler): boolean => {
		return handler.deckCardProvider()?.getEffectiveManaCost() < cost;
	};

export const effectiveCostLessThanRemainingMana = (handler: Handler, deckState: DeckState): boolean => {
	return handler.deckCardProvider()?.getEffectiveManaCost() < deckState.hero.manaLeft;
};

export const effectiveCostMore =
	(cost: number) =>
	(handler: Handler): boolean => {
		return handler.deckCardProvider()?.getEffectiveManaCost() > cost;
	};

export const effectiveCostEqual =
	(cost: number) =>
	(handler: Handler): boolean => {
		return handler.deckCardProvider()?.getEffectiveManaCost() === cost;
	};

export const baseCostEqual =
	(cost: number) =>
	(handler: Handler): boolean => {
		return handler.deckCardProvider()?.manaCost === cost;
	};

export const notInInitialDeck = (handler: Handler): boolean => {
	return handler.deckCardProvider().creatorCardId != null || handler.deckCardProvider().creatorCardIds?.length > 0;
};

export const excludeEntityId =
	(entityId: number) =>
	(handler: Handler): boolean => {
		return !!handler.deckCardProvider()?.entityId && handler.deckCardProvider()?.entityId != entityId;
	};

export const lastAffectedByCardId =
	(cardId: CardIds) =>
	(handler: Handler, deckState: DeckState): boolean => {
		const affectedCardIds = [
			handler.deckCardProvider().lastAffectedByCardId,
			...handler.deckCardProvider().lastAffectedByCardIds,
		].filter((id) => !!id);
		const affectedEntityIds = [handler.deckCardProvider().lastAffectedByEntityId].filter((id) => !!id);
		const entityToCardIds = affectedEntityIds
			.map((entityId) =>
				deckState.getAllCardsInDeck().find((c) => c.entityId === entityId || c.entityId === -entityId),
			)
			.map((c) => c?.cardId)
			.filter((id) => !!id);
		const allCardIds = [...affectedCardIds, ...entityToCardIds];
		return allCardIds.includes(cardId);
	};

export const healthBiggerThanAttack = (handler: Handler): boolean => {
	return handler.referenceCardProvider().health > handler.referenceCardProvider().attack;
};

export const attackLessThan =
	(attack: number) =>
	(handler: Handler): boolean => {
		return handler.referenceCardProvider().attack != null && handler.referenceCardProvider().attack < attack;
	};

export const cardIs =
	(...cardIds: readonly CardIds[]) =>
	(handler: Handler): boolean => {
		return cardIds.includes(handler.referenceCardProvider()?.id as CardIds);
	};

export const spellPlayedThisMatch = (handler: Handler, deckState: DeckState, options?: SelectorOptions): boolean => {
	return (
		deckState?.spellsPlayedThisMatch
			.map((spell) => spell.entityId)
			.includes(handler.deckCardProvider()?.entityId) ||
		deckState?.spellsPlayedThisMatch.map((spell) => spell.entityId).includes(-handler.deckCardProvider()?.entityId)
	);
};
export const cardsPlayedThisMatch = (handler: Handler, deckState: DeckState, options?: SelectorOptions): boolean => {
	const result =
		deckState?.cardsPlayedThisMatch.map((card) => card.entityId).includes(handler.deckCardProvider()?.entityId) ||
		deckState?.cardsPlayedThisMatch
			.map((card) => card.entityId)
			.includes(-(handler.deckCardProvider()?.entityId ?? 0));
	return result;
};
export const minionsDeadSinceLastTurn = (
	handler: Handler,
	deckState: DeckState,
	options?: SelectorOptions,
): boolean => {
	const result =
		deckState?.minionsDeadSinceLastTurn
			.map((card) => card.entityId)
			.includes(handler.deckCardProvider()?.entityId) ||
		deckState?.minionsDeadSinceLastTurn
			.map((card) => card.entityId)
			.includes(-(handler.deckCardProvider()?.entityId ?? 0));
	return result;
};

const hasMechanic =
	(mechanic: GameTag) =>
	(handler: Handler): boolean =>
		(handler.referenceCardProvider()?.mechanics ?? []).includes(GameTag[mechanic]);
export const battlecry = hasMechanic(GameTag.BATTLECRY);
export const chooseOne = hasMechanic(GameTag.CHOOSE_ONE);
export const corrupt = hasMechanic(GameTag.CORRUPT);
export const corrupted = hasMechanic(GameTag.CORRUPTED);
export const deathrattle = hasMechanic(GameTag.DEATHRATTLE);
export const discover = hasMechanic(GameTag.DISCOVER);
export const divineShield = hasMechanic(GameTag.DIVINE_SHIELD);
export const freeze = hasMechanic(GameTag.FREEZE);
export const frenzy = hasMechanic(GameTag.FRENZY);
export const lifesteal = hasMechanic(GameTag.LIFESTEAL);
export const magnetic = hasMechanic(GameTag.MODULAR);
export const outcast = hasMechanic(GameTag.OUTCAST);
export const overload = hasMechanic(GameTag.OVERLOAD);
export const rush = hasMechanic(GameTag.RUSH);
export const secret = hasMechanic(GameTag.SECRET);
export const taunt = hasMechanic(GameTag.TAUNT);
export const dredge = hasMechanic(GameTag.DREDGE);

export const isSi7 = (handler: Handler): boolean =>
	Object.values(Locale)
		.filter((loc) => loc === null || isNaN(Number(loc)))
		.filter((loc) => loc !== Locale[Locale.UNKNOWN])
		.some((locale: string) => handler.referenceCardProvider()?.name?.includes(getSi7Locale(locale)));

export const spellSchool =
	(spellSchool: SpellSchool) =>
	(handler: Handler): boolean => {
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

export const cardType =
	(type: CardType) =>
	(handler: Handler): boolean => {
		return (
			handler.deckCardProvider()?.cardType?.toLowerCase() === CardType[type].toLowerCase() ||
			handler.referenceCardProvider()?.type?.toLowerCase() === CardType[type].toLowerCase()
		);
	};
export const minion = cardType(CardType.MINION);
export const spell = cardType(CardType.SPELL);
export const weapon = cardType(CardType.WEAPON);

export const race =
	(race: Race) =>
	(handler: Handler): boolean => {
		return (
			handler.referenceCardProvider()?.races?.includes(Race[race]) ||
			handler.referenceCardProvider()?.races?.includes(Race[Race.ALL])
		);
	};
export const beast = race(Race.BEAST);
export const demon = race(Race.DEMON);
export const dragon = race(Race.DRAGON);
export const mech = race(Race.MECH);
export const murloc = race(Race.MURLOC);
export const naga = race(Race.NAGA);
export const pirate = race(Race.PIRATE);
export const undead = race(Race.UNDEAD);
export const imp = hasMechanic(GameTag.IMP);
export const whelp = hasMechanic(GameTag.WHELP);

export const currentClass = (handler: Handler, deckState: DeckState, options?: SelectorOptions): boolean => {
	return handler.referenceCardProvider()?.cardClass === deckState?.hero?.playerClass?.toUpperCase();
};
export const cardClass =
	(cardClass: CardClass) =>
	(handler: Handler): boolean => {
		return handler.referenceCardProvider()?.cardClass === CardClass[cardClass];
	};
export const neutral = cardClass(CardClass.NEUTRAL);
export const paladin = cardClass(CardClass.PALADIN);
export const rogue = cardClass(CardClass.ROGUE);

export const rarity =
	(rarity: RarityTYpe) =>
	(handler: Handler): boolean => {
		return handler.referenceCardProvider()?.rarity?.toLowerCase() === rarity?.toLowerCase();
	};
export const legendary = rarity('Legendary');

// TODO: implement it
export const damage = (handler: Handler): boolean => {
	return true;
};
