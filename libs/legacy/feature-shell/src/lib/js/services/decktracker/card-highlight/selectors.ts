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
import { Selector, SelectorInput } from './cards-highlight.service';

export const and = (...filters: Selector[]): Selector => {
	return (input: SelectorInput) => filters.every((filter) => filter(input));
};

export const or = (...filters: Selector[]): Selector => {
	return (input: SelectorInput) => filters.filter((f) => !!f).some((filter) => filter(input));
};

export const not = (filter: Selector): Selector => {
	return (input: SelectorInput) => !filter(input);
};

const inZoneName =
	(zone: string) =>
	(input: SelectorInput): boolean =>
		input.zone?.toLowerCase() === zone?.toLowerCase();
export const inDeck = inZoneName('deck');
export const inHand = inZoneName('hand');
export const inOther = inZoneName('other');
export const inGraveyard = inZoneName('graveyard');

export const side =
	(side: 'player' | 'opponent' | 'duels') =>
	(input: SelectorInput): boolean => {
		return input.side === side;
	};

export const opposingSide =
	(side: 'player' | 'opponent' | 'duels') =>
	(input: SelectorInput): boolean => {
		return side === 'player'
			? input.side === 'opponent'
			: side === 'opponent'
			? input.side === 'player'
			: input.side === 'duels';
	};

export const effectiveCostLess =
	(cost: number) =>
	(input: SelectorInput): boolean =>
		input.deckCard?.getEffectiveManaCost() < cost;

export const effectiveCostLessThanRemainingMana = (input: SelectorInput): boolean =>
	input.deckCard?.getEffectiveManaCost() < input.deckState.hero.manaLeft;

export const effectiveCostMore =
	(cost: number) =>
	(input: SelectorInput): boolean =>
		input.deckCard?.getEffectiveManaCost() > cost;

export const effectiveCostEqual =
	(cost: number) =>
	(input: SelectorInput): boolean =>
		input.deckCard?.getEffectiveManaCost() === cost;

export const baseCostEqual =
	(cost: number) =>
	(input: SelectorInput): boolean =>
		input.card?.cost === cost;

export const notInInitialDeck = (input: SelectorInput): boolean => input.deckCard.creatorCardId != null;

export const excludeEntityId =
	(entityId: number) =>
	(input: SelectorInput): boolean =>
		input?.entityId && input?.entityId != entityId;

export const lastAffectedByCardId =
	(cardId: CardIds) =>
	(input: SelectorInput): boolean => {
		const affectedCardIds = [input.deckCard.lastAffectedByCardId];
		const affectedEntityIds = [input.deckCard.lastAffectedByEntityId].filter((id) => !!id);
		const entityToCardIds = affectedEntityIds
			.map((entityId) =>
				input.deckState.getAllCardsInDeck().find((c) => c.entityId === entityId || c.entityId === -entityId),
			)
			.map((c) => c?.cardId)
			.filter((id) => !!id);
		const allCardIds = [...affectedCardIds, ...entityToCardIds];
		return allCardIds.includes(cardId);
	};

export const healthBiggerThanAttack = (input: SelectorInput): boolean => input.card.health > input.card.attack;

export const attackLessThan =
	(attack: number) =>
	(input: SelectorInput): boolean =>
		input.card.attack != null && input.card.attack < attack;

export const cardIs =
	(...cardIds: readonly CardIds[]) =>
	(input: SelectorInput): boolean =>
		cardIds.includes(input.card?.id as CardIds);

export const spellPlayedThisMatch = (input: SelectorInput): boolean =>
	input.deckState?.spellsPlayedThisMatch.map((spell) => spell.entityId).includes(input.entityId) ||
	input.deckState?.spellsPlayedThisMatch.map((spell) => spell.entityId).includes(-input.entityId);

export const cardsPlayedThisMatch = (input: SelectorInput): boolean => {
	const result =
		input.deckState?.cardsPlayedThisMatch.map((card) => card.entityId).includes(input.entityId) ||
		input.deckState?.cardsPlayedThisMatch.map((card) => card.entityId).includes(-(input?.entityId ?? 0));
	// console.debug(
	// 	'cardPlayedThisMatch',
	// 	input.cardId,
	// 	input.entityId,
	// 	result,
	// 	input.deckState?.cardsPlayedThisMatch,
	// 	input,
	// );
	return result;
};

export const minionsDeadSinceLastTurn = (input: SelectorInput): boolean =>
	input.deckState?.minionsDeadSinceLastTurn.map((card) => card.entityId).includes(input.entityId) ||
	input.deckState?.minionsDeadSinceLastTurn.map((card) => card.entityId).includes(-(input.entityId ?? 0));

const hasMechanic =
	(mechanic: GameTag) =>
	(input: SelectorInput): boolean =>
		(input.card?.mechanics ?? []).includes(GameTag[mechanic]);
export const battlecry = hasMechanic(GameTag.BATTLECRY);
export const chooseOne = hasMechanic(GameTag.CHOOSE_ONE);
export const combo = hasMechanic(GameTag.COMBO);
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

export const isSi7 = (input: SelectorInput): boolean =>
	Object.values(Locale)
		.filter((loc) => loc === null || isNaN(Number(loc)))
		.filter((loc) => loc !== Locale[Locale.UNKNOWN])
		.some((locale: string) => input.card?.name?.includes(getSi7Locale(locale)));

export const spellSchool =
	(spellSchool: SpellSchool) =>
	(input: SelectorInput): boolean =>
		input.card?.spellSchool === SpellSchool[spellSchool];
export const arcane = spellSchool(SpellSchool.ARCANE);
export const fel = spellSchool(SpellSchool.FEL);
export const fire = spellSchool(SpellSchool.FIRE);
export const frost = spellSchool(SpellSchool.FROST);
export const holy = spellSchool(SpellSchool.HOLY);
export const nature = spellSchool(SpellSchool.NATURE);
export const shadow = spellSchool(SpellSchool.SHADOW);
export const hasSpellSchool = (input: SelectorInput): boolean => {
	return !!input.card?.spellSchool;
};

export const cardType =
	(type: CardType) =>
	(input: SelectorInput): boolean =>
		input.card?.type?.toLowerCase() === CardType[type].toLowerCase();
export const minion = cardType(CardType.MINION);
export const spell = cardType(CardType.SPELL);
export const weapon = cardType(CardType.WEAPON);

export const race =
	(race: Race) =>
	(input: SelectorInput): boolean =>
		input.card?.races?.includes(Race[race]) || input.card?.races?.includes(Race[Race.ALL]);
export const beast = race(Race.BEAST);
export const demon = race(Race.DEMON);
export const dragon = race(Race.DRAGON);
export const elemental = race(Race.ELEMENTAL);
export const imp = hasMechanic(GameTag.IMP);
export const mech = race(Race.MECH);
export const murloc = race(Race.MURLOC);
export const naga = race(Race.NAGA);
export const pirate = race(Race.PIRATE);
export const totem = race(Race.TOTEM);
export const undead = race(Race.UNDEAD);
export const whelp = hasMechanic(GameTag.WHELP);
export const tribeless = (input: SelectorInput): boolean =>
	(input.card?.races?.filter((r) => r !== Race[Race.BLANK]).length ?? 0) === 0;

export const currentClass = (input: SelectorInput): boolean =>
	input.card?.classes?.includes(input.deckState?.hero?.playerClass?.toUpperCase());

export const cardClass =
	(cardClass: CardClass) =>
	(input: SelectorInput): boolean =>
		input.card?.classes?.includes(CardClass[cardClass]);
export const neutral = cardClass(CardClass.NEUTRAL);
export const paladin = cardClass(CardClass.PALADIN);
export const rogue = cardClass(CardClass.ROGUE);

export const rarity =
	(rarity: RarityTYpe) =>
	(input: SelectorInput): boolean =>
		input.card?.rarity?.toLowerCase() === rarity?.toLowerCase();
export const legendary = rarity('Legendary');

// TODO: implement it
export const damage = (input: SelectorInput): boolean => {
	return true;
};
