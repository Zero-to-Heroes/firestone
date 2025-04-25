import { getSi7Locale } from '@components/game-counters/definitions/si7-counter';
import {
	CardClass,
	CardIds,
	CardType,
	DkruneTypes,
	GameTag,
	Locale,
	Race,
	RarityTYpe,
	SpellSchool,
} from '@firestone-hs/reference-data';
import { EXTENDED_STARSHIP_CARDS, getCost, getProcessedCard } from '@firestone/game-state';
import { PLAGUES } from '../event-parser/special-cases/plagues-parser';
import { Selector, SelectorInput } from './cards-highlight-common.service';

export const and = (...filters: Selector[]): Selector => {
	return (input: SelectorInput) => filters.every((filter) => filter(input));
};

export const or = (...filters: Selector[]): Selector => {
	return (input: SelectorInput) => filters.filter((f) => !!f).some((filter) => filter(input));
};

export const orWithHighlight = (...filters: Selector[]): Selector => {
	return (input: SelectorInput) => {
		let shouldHighlight = false;
		for (const filter of filters.filter((f) => !!f)) {
			const output = filter(input);
			if (!isNaN(+output)) {
				return output;
			} else if (output === 'tooltip') {
				return 'tooltip';
			}
			if (output) {
				shouldHighlight = true;
			}
		}
		return shouldHighlight;
	};
};

export const tooltip = (filter: Selector): Selector => {
	return (input: SelectorInput) => (!!filter(input) ? 'tooltip' : false);
};

export const highlightConditions = (...filters: Selector[]): Selector => {
	return (input: SelectorInput) => {
		const validFilters = filters.filter((f) => !!f);
		if (!validFilters.length) {
			return false;
		}
		for (let i = 0; i < validFilters.length; i++) {
			const output = validFilters[i](input);
			if (output === 'tooltip') {
				return 'tooltip';
			} else if (output) {
				return i + 1; // Avoid returning 0 (because in JS 0 is falsy)
			}
		}
		return false;
	};
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
export const inOther = inZoneName('other') || inZoneName('other-generated') || inZoneName('board');
export const inGraveyard = (input: SelectorInput) =>
	input.zone?.toLowerCase() === 'graveyard'?.toLowerCase() ||
	input.deckState.minionsDeadThisMatch.some(
		(m) => Math.abs(m.entityId) === Math.abs(input.entityId) && m.cardId === input.cardId,
	);
export const discarded = inZoneName('discard');
export const inPlay = (input: SelectorInput): boolean =>
	input.deckCard.zone !== 'BURNED' &&
	input.deckCard.zone !== 'REMOVEDFROMGAME' &&
	input.deckCard.zone !== 'DISCARD' &&
	input.deckCard.zone !== 'SETASIDE' &&
	input.deckCard.zone !== 'TRANSFORMED_INTO_OTHER' &&
	!!and(inOther, not(inGraveyard))(input);

export const side =
	(side: 'player' | 'opponent' | 'single') =>
	(input: SelectorInput): boolean => {
		return input.side === side;
	};

export const opposingSide =
	(side: 'player' | 'opponent' | 'single') =>
	(input: SelectorInput): boolean => {
		return side === 'player'
			? input.side === 'opponent'
			: side === 'opponent'
			? input.side === 'player'
			: input.side === 'single';
	};

export const hasMultipleCopies = (input: SelectorInput): boolean =>
	input.deckState.deck?.filter((c) => c.cardId === input.cardId).length > 1;

export const effectiveCostLess =
	(cost: number) =>
	(input: SelectorInput): boolean =>
		getCost(input.deckCard, input.deckState, input.allCards) < cost;

export const effectiveCostLessThanRemainingMana = (input: SelectorInput): boolean =>
	getCost(input.deckCard, input.deckState, input.allCards) < input.deckState.hero.manaLeft;

export const effectiveCostMore =
	(cost: number) =>
	(input: SelectorInput): boolean => {
		return getCost(input.deckCard, input.deckState, input.allCards) > cost;
	};

export const costMore =
	(cost: number) =>
	(input: SelectorInput): boolean =>
		input.deckCard?.refManaCost > cost;

export const effectiveCostEqual =
	(cost: number) =>
	(input: SelectorInput): boolean =>
		getCost(input.deckCard, input.deckState, input.allCards) === cost;

export const baseCostEqual =
	(cost: number) =>
	(input: SelectorInput): boolean =>
		input.card?.cost === cost;

export const inInitialDeck = (input: SelectorInput): boolean =>
	input.deckCard.creatorCardId == null && !input.deckCard.stolenFromOpponent;
export const notInInitialDeck = (input: SelectorInput): boolean =>
	input.deckCard.creatorCardId != null || input.deckCard.stolenFromOpponent;

export const inStartingHand = (input: SelectorInput): boolean =>
	input.deckState.cardsInStartingHand?.some(
		(c) => Math.abs(c.entityId) === Math.abs(input.entityId) && c.cardId === input.cardId,
	);

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

export const attackGreaterThan =
	(attack: number) =>
	(input: SelectorInput): boolean =>
		input.card.attack != null && input.card.attack > attack;
export const attackLessThan =
	(attack: number) =>
	(input: SelectorInput): boolean =>
		input.card.attack != null && input.card.attack < attack;
export const attackIs =
	(attack: number) =>
	(input: SelectorInput): boolean =>
		input.card.attack === attack;

export const healthGreaterThan =
	(health: number) =>
	(input: SelectorInput): boolean =>
		input.card.health != null && input.card.health > health;
export const healthLessThan =
	(health: number) =>
	(input: SelectorInput): boolean =>
		input.card.health != null && input.card.health < health;
export const healthIs =
	(health: number) =>
	(input: SelectorInput): boolean =>
		input.card.health === health;

export const cardIs =
	(...cardIds: readonly CardIds[]) =>
	(input: SelectorInput): boolean =>
		!!cardIds?.length && cardIds.includes(input.card?.id as CardIds);

// Fix issues where there are multiple entities with the same entityId, because the card got transformed
export const entityIs =
	(...entities: readonly { entityId: number; cardId: string }[]) =>
	(input: SelectorInput): boolean =>
		!!entities?.filter((e) => e?.entityId != null)?.length &&
		input.entityId != null &&
		!!entities
			.filter((e) => e?.entityId != null)
			.find((e) => Math.abs(e.entityId) === Math.abs(input.entityId) && e.cardId === input.cardId);

export const spellPlayedThisMatch = (input: SelectorInput): boolean =>
	input.deckState?.spellsPlayedThisMatch.some(
		(spell) => Math.abs(spell.entityId) === Math.abs(input.entityId) && spell.cardId === input.cardId,
	);

export const spellPlayedThisMatchOnFriendly = (input: SelectorInput): boolean =>
	input.deckState?.spellsPlayedOnFriendlyEntities.some(
		(spell) => Math.abs(spell.entityId) === Math.abs(input.entityId) && spell.cardId === input.cardId,
	);

export const spellPlayedThisMatchOnFriendlyMinion = (input: SelectorInput): boolean =>
	input.deckState?.spellsPlayedOnFriendlyMinions.some(
		(spell) => Math.abs(spell.entityId) === Math.abs(input.entityId) && spell.cardId === input.cardId,
	);

export const cardsPlayedThisMatch = (input: SelectorInput): boolean =>
	input.deckState?.cardsPlayedThisMatch.some(
		(c) => Math.abs(c.entityId) === Math.abs(input.entityId) && c.cardId === input.cardId,
	);

export const cardsPlayedLastTurn = (input: SelectorInput): boolean =>
	input.deckState?.cardsPlayedLastTurn.some(
		(c) => Math.abs(c.entityId) === Math.abs(input.entityId) && c.cardId === input.cardId,
	);

export const secretsTriggeredThisMatch = (input: SelectorInput): boolean =>
	input.deckState?.secretsTriggeredThisMatch.some(
		(c) => Math.abs(c.entityId) === Math.abs(input.entityId) && c.cardId === input.cardId,
	);

export const minionPlayedThisMatch = (input: SelectorInput): boolean => {
	const minionsPlayedThisMatch = input.deckState?.cardsPlayedThisMatch.filter(
		(c) => input.allCards.getCard(c.cardId).type === 'Minion',
	);
	const result = minionsPlayedThisMatch.some(
		(c) => c.cardId === input.cardId && Math.abs(c.entityId) === Math.abs(input.entityId),
	);
	return result;
};

export const minionsDeadSinceLastTurn = (input: SelectorInput): boolean =>
	input.deckState?.minionsDeadSinceLastTurn.some(
		(c) => Math.abs(c.entityId) === Math.abs(input.entityId) && c.cardId === input.cardId,
	);

const hasMechanic =
	(mechanic: GameTag) =>
	(input: SelectorInput): boolean => {
		const refCard = getProcessedCard(input.cardId, input.entityId, input.deckState, input.allCards);
		return refCard?.mechanics?.includes(GameTag[mechanic]);
	};
const hasMechanicStr =
	(mechanic: string) =>
	(input: SelectorInput): boolean => {
		const refCard = getProcessedCard(input.cardId, input.entityId, input.deckState, input.allCards);
		return refCard?.mechanics?.includes(mechanic);
	};
export const aura = hasMechanic(GameTag.PALADIN_AURA);
export const battlecry = hasMechanic(GameTag.BATTLECRY);
export const charge = hasMechanic(GameTag.CHARGE);
export const chooseOne = and(
	hasMechanic(GameTag.CHOOSE_ONE),
	not(hasMechanicStr('CHOOSE_TWICE')),
	not(hasMechanicStr('CHOOSE_THRICE')),
);
export const combo = hasMechanic(GameTag.COMBO);
export const corrupt = hasMechanic(GameTag.CORRUPT);
export const corrupted = hasMechanic(GameTag.CORRUPTED);
export const deathrattle = hasMechanic(GameTag.DEATHRATTLE);
export const discover = hasMechanic(GameTag.DISCOVER);
export const divineShield = hasMechanic(GameTag.DIVINE_SHIELD);
export const dredge = hasMechanic(GameTag.DREDGE);
export const excavate = hasMechanic(GameTag.EXCAVATE);
export const forge = hasMechanic(GameTag.FORGE);
export const forged = hasMechanic(GameTag.FORGED);
export const freeze = hasMechanic(GameTag.FREEZE);
export const frenzy = hasMechanic(GameTag.FRENZY);
export const imbue = hasMechanic(GameTag.IMBUE);
export const infuse = hasMechanic(GameTag.INFUSE);
export const lifesteal = hasMechanic(GameTag.LIFESTEAL);
export const magnetic = hasMechanic(GameTag.MODULAR);
export const outcast = hasMechanic(GameTag.OUTCAST);
export const overload = hasMechanic(GameTag.OVERLOAD);
export const quickdraw = hasMechanic(GameTag.QUICKDRAW);
export const reborn = hasMechanic(GameTag.REBORN);
export const rush = hasMechanic(GameTag.RUSH);
export const secret = hasMechanic(GameTag.SECRET);
export const taunt = hasMechanic(GameTag.TAUNT);
export const tradeable = hasMechanic(GameTag.TRADEABLE);
export const windfury = hasMechanic(GameTag.WINDFURY);

export const isSi7 = (input: SelectorInput): boolean =>
	Object.values(Locale)
		.filter((loc) => loc === null || isNaN(Number(loc)))
		.filter((loc) => loc !== Locale[Locale.UNKNOWN])
		.some((locale: string) => input.card?.name?.includes(getSi7Locale(locale)));

export const summonsTreant = (input: SelectorInput): boolean =>
	input.card.relatedCardDbfIds?.some((c) => input.allCards.getCard(c).isTreant);
export const isTreant = (input: SelectorInput): boolean => input.card.isTreant;

const PLAGUE_GENERATORS = [CardIds.DistressedKvaldir, CardIds.DownWithTheShip, CardIds.Helya, CardIds.StaffOfThePrimus];
export const generatesPlague = (input: SelectorInput): boolean => PLAGUE_GENERATORS.includes(input.cardId as CardIds);
export const isPlague = (input: SelectorInput): boolean => PLAGUES.includes(input.cardId as CardIds);

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

export const spellSchoolPlayedThisMatch = (input: SelectorInput): boolean =>
	input.deckState?.uniqueSpellSchools?.includes(input.card?.spellSchool);

export const passive = hasMechanic(GameTag.DUNGEON_PASSIVE_BUFF);
export const cardType =
	(type: CardType) =>
	(input: SelectorInput): boolean =>
		input.card?.type?.toLowerCase() === CardType[type].toLowerCase();
export const location = cardType(CardType.LOCATION);
export const minion = cardType(CardType.MINION);
export const spell = and(cardType(CardType.SPELL), not(passive));
export const weapon = cardType(CardType.WEAPON);

export const createLocation = cardIs(
	CardIds.Sancazel_VAC_923,
	CardIds.TravelAgent_VAC_438,
	CardIds.ScrapbookingStudent_VAC_529,
	CardIds.CruiseCaptainLora_VAC_506,
);
export const locationExtended = or(location, createLocation);
export const givesHeroAttack = or(weapon);

export const race =
	(race: Race) =>
	(input: SelectorInput): boolean =>
		input.card?.races?.includes(Race[race]) || input.card?.races?.includes(Race[Race.ALL]);
export const beast = race(Race.BEAST);
export const demon = race(Race.DEMON);
export const dragon = race(Race.DRAGON);
export const draenei = race(Race.DRAENEI);
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

export const classGroup =
	(classGroup: GameTag.PROTOSS | GameTag.ZERG | GameTag.TERRAN) =>
	(input: SelectorInput): boolean =>
		input.card?.mechanics?.includes(GameTag[classGroup]);
export const protoss = classGroup(GameTag.PROTOSS);
export const terran = classGroup(GameTag.TERRAN);
export const zerg = classGroup(GameTag.ZERG);

export const hasTribeNotPlayedThisMatch = (input: SelectorInput): boolean => {
	if (!input.card.races?.length) {
		return false;
	}
	if (input.card.races.includes(Race[Race.ALL])) {
		return true;
	}
	const uniqueRacesPlayedThisMatch = input.deckState.cardsPlayedThisMatch
		.flatMap((c) => input.allCards.getCard(c.cardId).races)
		.filter((r, index, self) => self.indexOf(r) === index)
		.filter((r) => r != Race[Race.ALL]);
	return input.card.races.some((r) => !uniqueRacesPlayedThisMatch.includes(r));
};

export const hasRune =
	(rune: DkruneTypes) =>
	(input: SelectorInput): boolean => {
		return (
			Object.keys(input.card?.additionalCosts ?? {}).includes(DkruneTypes[rune]) &&
			input.card.additionalCosts[DkruneTypes[rune]]
		);
	};
export const unholyRune = hasRune(DkruneTypes.UNHOLYRUNE);
export const bloodRune = hasRune(DkruneTypes.BLOODRUNE);
export const frostRune = hasRune(DkruneTypes.FROSTRUNE);

export const cardClass =
	(cardClass: CardClass) =>
	(input: SelectorInput): boolean =>
		input.card?.classes?.includes(CardClass[cardClass]);
export const neutral = cardClass(CardClass.NEUTRAL);
export const dream = cardClass(CardClass.DREAM);
export const paladin = cardClass(CardClass.PALADIN);
export const rogue = cardClass(CardClass.ROGUE);

export const currentClass = (input: SelectorInput): boolean =>
	!!input.deckState?.hero?.classes?.length &&
	input.card?.classes.some((cardClass) => input.deckState.hero.classes.includes(CardClass[cardClass]));
export const fromAnotherClass = and(not(currentClass), not(neutral), not(dream));

export const rarity =
	(rarity: RarityTYpe) =>
	(input: SelectorInput): boolean =>
		input.card?.rarity?.toLowerCase() === rarity?.toLowerCase();
export const legendary = rarity('Legendary');

export const spellDamage = (input: SelectorInput): boolean => {
	return input.card?.mechanics?.includes(GameTag[GameTag.SPELLPOWER]);
};
export const damage = (input: SelectorInput): boolean => {
	return input.card?.mechanics?.includes(GameTag[GameTag.DEAL_DAMAGE]);
};
export const restoreHealth = (input: SelectorInput): boolean => {
	return input.card?.mechanics?.includes('RESTORE_HEALTH');
};
export const spendCorpse = (input: SelectorInput): boolean => {
	return input.card?.mechanics?.includes(GameTag[GameTag.SPEND_CORPSE]);
};
export const generateCorpse = (input: SelectorInput): boolean => {
	return input.card?.mechanics?.includes(GameTag[GameTag.GENERATE_CORPSE]);
};
export const starshipPiece = (input: SelectorInput): boolean => {
	return input.card?.mechanics?.includes(GameTag[GameTag.STARSHIP_PIECE]);
};
export const buildingStarship = cardIs(
	CardIds.ExarchOthaar_GDB_856,
	CardIds.LaserBarrage_GDB_845,
	CardIds.BadOmen_GDB_124,
	CardIds.CrystalWelder_GDB_130,
	CardIds.BarrelRoll_GDB_465,
	CardIds.WarpDrive_GDB_474,
	CardIds.Suffocate_GDB_476,
	CardIds.Ghost_SC_408,
);
export const starshipExtended = or(starshipPiece, cardIs(...EXTENDED_STARSHIP_CARDS));

export const templar = (input: SelectorInput): boolean => {
	return [CardIds.DarkTemplar_SC_752, CardIds.HighTemplar_SC_765].includes(input.cardId as CardIds);
};
export const isStarshipPieceFor =
	(entityId: number) =>
	(input: SelectorInput): boolean => {
		const isStarshipPiece = input.allCards
			.getCard(input.cardId)
			?.mechanics?.includes(GameTag[GameTag.STARSHIP_PIECE]);
		if (!isStarshipPiece) {
			return false;
		}
		const starship = input.deckState.findCard(entityId)?.card;
		return !!starship?.storedInformation?.cards?.map((c) => c.entityId).includes(input.entityId);
	};
