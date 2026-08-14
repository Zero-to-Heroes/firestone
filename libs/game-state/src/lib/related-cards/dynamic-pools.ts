/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable no-mixed-spaces-and-tabs */
import {
	AllCardsService,
	arenaSets,
	brawlSets,
	CardClass,
	CardIds,
	CardRarity,
	CardType,
	DkruneTypes,
	GameFormat,
	GameTag,
	GameType,
	hasMechanic,
	isArena,
	ReferenceCard,
	SetId,
	SpellSchool,
} from '@firestone-hs/reference-data';

import { DeckState } from '../models/deck-state';
import { GameState } from '../models/game-state';
import { isCardValidForGame } from '../services/card-utils';
import { hasDynamicPool } from '../services/cards/_card.type';
import { cardsInfoCache } from '../services/cards/_mapping';
import { EntityLike, getControllerEntity, getEntityTag } from '../services/parser-entity-utils';
import { buildExcavateTreasures } from './excavate-treasures';
import { canIncludeHerald, getHeraldAdditionalCards } from './herald';
import { getLastRiffPlayed } from './riff';

export const IMBUED_HERO_POWERS = [
	CardIds.BlessingOfTheDragon_EDR_445p,
	CardIds.BlessingOfTheWolf_EDR_850p,
	CardIds.BlessingOfTheWind_EDR_448p,
	CardIds.DreamboundDisciple_BlessingOfTheGolem_EDR_847p,
	CardIds.LunarwingMessenger_BlessingOfTheMoon_EDR_449p,
];
const USE_UNCOLLECTIBLE_CARDS = [CardIds.Botface_TOY_906];
export const bwonsamdiBoonsEnchantments = [
	CardIds.TalanjiOfTheGraves_BoonOfPowerPlayerEnchEnchantment_TIME_619e,
	CardIds.TalanjiOfTheGraves_BoonOfSpeedPlayerEnchEnchantment_TIME_619e3,
	CardIds.TalanjiOfTheGraves_BoonOfLongevityPlayerEnchEnchantment_TIME_619e2,
];

export const getDynamicRelatedCardIds = (
	cardId: string,
	entityId: number,
	allCards: AllCardsService,
	inputOptions: {
		trueEntityId: number | null | undefined;
		format: GameFormat;
		gameType: GameType;
		scenarioId: number;
		currentClass: string;
		deckState: DeckState;
		opponentDeckState: DeckState;
		gameState: GameState;
		validArenaPool: readonly string[];
	},
): readonly string[] | { override: true; cards: readonly string[] } => {
	const result = getDynamicRelatedCardIdsInternal(cardId, entityId, allCards, inputOptions);

	const refCard = allCards.getCard(cardId);
	const additionalCards = [
		...getHeraldAdditionalCards(refCard, inputOptions.deckState, inputOptions.opponentDeckState),
		...getLastRiffPlayed(refCard, inputOptions.deckState, allCards),
	];

	if (hasOverride(result)) {
		return { override: true, cards: [...(result as { cards: readonly string[] }).cards, ...additionalCards] };
	}
	return [...((result as readonly string[]) ?? []), ...additionalCards];
};

const getDynamicRelatedCardIdsInternal = (
	cardId: string,
	entityId: number,
	allCards: AllCardsService,
	inputOptions: {
		trueEntityId: number | null | undefined;
		format: GameFormat;
		gameType: GameType;
		scenarioId: number;
		currentClass: string;
		deckState: DeckState;
		opponentDeckState: DeckState;
		gameState: GameState;
		validArenaPool: readonly string[];
	},
): readonly string[] | { override: true; cards: readonly string[] } => {
	const options = {
		...inputOptions,
		initialDecklist: inputOptions.deckState?.deckList?.map((c) => c.cardId) ?? [],
	};

	const dynamicPoolImpl = cardsInfoCache[cardId];
	if (hasDynamicPool(dynamicPoolImpl)) {
		const result = dynamicPoolImpl.dynamicPool({
			cardId,
			entityId,
			allCards,
			inputOptions: options,
		});
		if (dynamicPoolImpl.overrideDefaultDynamicPool) {
			return {
				override: true,
				cards: result,
			};
		} else {
			return result;
		}
	}

	const refCard = allCards.getCard(cardId);

	if (hasMechanic(refCard, GameTag.EXCAVATE)) {
		const excavateTreasures = getExcavateTreasuresPool(
			inputOptions.deckState,
			inputOptions.deckState?.hero?.classes ?? [],
		);
		if (excavateTreasures.length > 0) {
			return excavateTreasures;
		}
	}

	const deckCardForCreator = inputOptions.deckState?.findCard(entityId)?.card;
	const creatorCardIdForPool = deckCardForCreator?.creatorCardId;
	// Unknown generated cards: show the creator's StaticGeneratingCard.dynamicPool when present.
	if (!cardId?.length && creatorCardIdForPool) {
		const creatorPoolImpl = cardsInfoCache[creatorCardIdForPool];
		if (hasDynamicPool(creatorPoolImpl)) {
			return creatorPoolImpl.dynamicPool({
				cardId: creatorCardIdForPool,
				entityId,
				allCards,
				inputOptions: options,
			});
		}
	}
	return [];
};

const BAN_LIST = [
	// https://hearthstone.wiki.gg/wiki/Special:RunQuery/WikiBanPool?pfRunQueryFormName=WikiBanPool&wpRunQuery=Run%2Bquery&WikiBanPool_form_only%5BoriginalPage%5D=Nebula&WikiBanPool_form_only%5Bid%5D=2&WikiBanPool_form_only%5BgameMode%5D=1
	CardIds.BounceAroundFtGarona,
	CardIds.CthunTheShattered,
	CardIds.ClimacticNecroticExplosion,
	CardIds.TheGalacticProjectionOrb_TOY_378,
	// https://hearthstone.wiki.gg/wiki/Special:RunQuery/WikiBanPool?pfRunQueryFormName=WikiBanPool&wpRunQuery=Run%2Bquery&WikiBanPool_form_only%5BoriginalPage%5D=Nebula&WikiBanPool_form_only%5Bid%5D=12&WikiBanPool_form_only%5BgameMode%5D=1
	CardIds.Magtheridon_BT_850,
	CardIds.TheDarkness_LOOT_526,
	CardIds.ZilliaxDeluxe3000_TOY_330,
	CardIds.DragonSoulShattered_CATA_EVENT_110,
	CardIds.KingoftheUnderbelly_JAIL_831,
	CardIds.SliceandDice_JAIL_500,
];

const BAN_LIST_ARENA = [
	CardIds.Amirdrassil_FIR_907,
	CardIds.FyrakkTheBlazing_FIR_959,
	CardIds.Kiljaeden_GDB_145,
	CardIds.Razidir_TLC_463,
	CardIds.Shaladrassil_EDR_846,
	CardIds.StormTheGates_TLC_EVENT_400,
	CardIds.StoryOfUmbra_DINO_415,
	CardIds.TheGreatDracorex_DINO_401,
	CardIds.Tortolla_EDR_471,
];

let uncollectibleCards: readonly ReferenceCard[] = [];
let baseCards: readonly ReferenceCard[] = [];

export interface FilterCardsOptions {
	format: GameFormat;
	gameType: GameType;
	scenarioId: number;
	initialDecklist?: readonly string[];
	validArenaPool: readonly string[];
	currentClass: string | undefined;
}

export const filterCards = (
	allCards: AllCardsService,
	options: FilterCardsOptions,
	sourceCardId: string | null,
	...filters: ((ref: ReferenceCard) => boolean | undefined)[]
) => {
	let format = options.format;
	let gameType = options.gameType;
	if (gameType === GameType.GT_ARENA || gameType === GameType.GT_UNDERGROUND_ARENA) {
		// If we have no valid arena sets and no valid arena pool, we default to ranked wild
		if (!arenaSets?.length && options.validArenaPool.length === 0) {
			gameType = GameType.GT_RANKED;
			format = GameFormat.FT_WILD;
		}
	}

	const summonsInPlay = doesSummonInPlay(sourceCardId);
	const wantsColossal = wantsColossalMinions(sourceCardId);
	const baseCards = getBaseCards(sourceCardId, allCards);
	const baseCardsExtended = baseCards
		.filter((c) => (isArena(options.gameType) ? !BAN_LIST_ARENA.includes(c.id as CardIds) : true))
		.filter((c) => (summonsInPlay && !wantsColossal ? !hasMechanic(c, GameTag.COLOSSAL) : true))
		.filter((c) => canIncludeStarcraftFaction(c, options.initialDecklist, options.currentClass, allCards))
		.filter((c) => canIncludeCthun(c, options.initialDecklist, options.currentClass, allCards))
		.filter((c) => canIncludeGalakrond(c, options.initialDecklist, options.currentClass, allCards))
		.filter((c) => canIncludeImbue(c, options.initialDecklist, options.currentClass, allCards))
		.filter((c) => canIncludeHerald(c, options.initialDecklist, options.currentClass, allCards))
		.filter((c) => {
			const debug = c.id === CardIds.FinalShowdown;
			if (gameType === GameType.GT_ARENA || gameType === GameType.GT_UNDERGROUND_ARENA) {
				// If we have some valid arena sets, we use them
				if (!arenaSets?.length) {
					if (options.validArenaPool.length > 0) {
						return options.validArenaPool.includes(c.id);
					}
				}
			} else if (gameType === GameType.GT_TAVERNBRAWL) {
				const setsForCurrentBrawl = brawlSets[options.scenarioId];
				if (setsForCurrentBrawl?.length > 0) {
					return setsForCurrentBrawl.includes(c.set.toLowerCase() as SetId);
				}
				// Use the default pool otherwise
			}
			return !!c.set ? isCardValidForGame(c, format, gameType) : false;
		})
		.filter(
			(c) =>
				!sourceCardId ||
				(c.id !== sourceCardId && allCards.getRootCardId(c.id) !== allCards.getRootCardId(sourceCardId)),
		);
	return baseCardsExtended.filter((c) => filters.every((f) => f(c))).map((c) => c.id);
};

const getBaseCards = (sourceCardId: string | null, allCards: AllCardsService): readonly ReferenceCard[] => {
	if (uncollectibleCards.length === 0) {
		uncollectibleCards = allCards
			.getCards()
			// https://hearthstone.wiki.gg/wiki/Special:RunQuery/WikiBanPool?pfRunQueryFormName=WikiBanPool&wpRunQuery=Run%2Bquery&WikiBanPool_form_only%5BoriginalPage%5D=Nebula&WikiBanPool_form_only%5Bid%5D=13&WikiBanPool_form_only%5BgameMode%5D=1
			.filter((c) => !hasMechanic(c, GameTag.TITAN))
			.filter(
				(c) =>
					!hasMechanic(c, GameTag.FABLED) &&
					!hasMechanic(c, GameTag.FABLED_PLUS) &&
					!hasMechanic(c, GameTag.IS_FABLED_BUNDLE_CARD),
			)
			.filter((c) => !BAN_LIST.includes(c.id as CardIds))
			// https://hearthstone.wiki.gg/wiki/Special:RunQuery/WikiBanPool?pfRunQueryFormName=WikiBanPool&wpRunQuery=Run%2Bquery&WikiBanPool_form_only%5BoriginalPage%5D=Nebula&WikiBanPool_form_only%5Bid%5D=6&WikiBanPool_form_only%5BgameMode%5D=1
			.filter(
				(c) =>
					!hasMechanic(c, GameTag.QUEST) &&
					!hasMechanic(c, GameTag.QUESTLINE) &&
					!hasMechanic(c, GameTag.QUESTLINE_PART),
			)
			.filter((c) => !hasThreeRunes(c))
			.sort(
				(a, b) =>
					(a.cost ?? 0) - (b.cost ?? 0) ||
					a.classes?.[0]?.localeCompare(b.classes?.[0] ?? '') ||
					a.name.localeCompare(b.name),
			);
	}
	if (baseCards.length === 0) {
		baseCards = uncollectibleCards.filter((c) => c.collectible);
	}
	return USE_UNCOLLECTIBLE_CARDS.includes(sourceCardId as CardIds) ? uncollectibleCards : baseCards;
};

// TODO: Move these to the hs-reference-data repo so it's all in the same place.

export const hasCorrectType = (card: ReferenceCard, targetType: CardType): boolean => {
	return card?.type?.toUpperCase() === CardType[targetType];
};

export const hasCorrectSpellSchool = (card: ReferenceCard, targetSpellSchool: SpellSchool): boolean => {
	return card?.spellSchool?.toUpperCase() === SpellSchool[targetSpellSchool];
};

export const hasCorrectClass = (card: ReferenceCard, targetClass: CardClass | null): boolean => {
	if (!targetClass) {
		return false;
	}
	return card?.classes?.includes(CardClass[targetClass]) ?? false;
};

export const hasCorrectRarity = (card: ReferenceCard, targetRarity: CardRarity): boolean => {
	return card?.rarity?.toUpperCase() === CardRarity[targetRarity];
};

export const isUnplayable = (card: ReferenceCard): boolean => {
	// TODO: extract the tag instead of using a hard-coded list
	return [CardIds.ShadowOfDemise, CardIds.ShadowOfDemise_CORE_RLK_567, CardIds.ShiftingScroll].includes(
		card.id as CardIds,
	);
};

export const getPlayerTag = (
	playerEntity: EntityLike | undefined,
	gameTag: GameTag,
	defaultValue: number = 0,
): number => {
	return getEntityTag(playerEntity, gameTag, defaultValue);
};

export const hasCorrectRune = (card: ReferenceCard, runeType: DkruneTypes): boolean => {
	switch (runeType) {
		case DkruneTypes.BLOODRUNE:
			return (card?.additionalCosts?.BLOODRUNE ?? 0) > 0;
		case DkruneTypes.UNHOLYRUNE:
			return (card?.additionalCosts?.UNHOLYRUNE ?? 0) > 0;
		case DkruneTypes.FROSTRUNE:
			return (card?.additionalCosts?.FROSTRUNE ?? 0) > 0;
		default:
			return false;
	}
};

// https://hearthstone.wiki.gg/wiki/Special:RunQuery/WikiBanPool?pfRunQueryFormName=WikiBanPool&wpRunQuery=Run%2Bquery&WikiBanPool_form_only%5BoriginalPage%5D=Nebula&WikiBanPool_form_only%5Bid%5D=10&WikiBanPool_form_only%5BgameMode%5D=1
const hasThreeRunes = (card: ReferenceCard): boolean => {
	if (!card.additionalCosts) {
		return false;
	}
	return (
		Object.keys(card.additionalCosts)
			.filter((key) => key.includes('RUNE'))
			.map((key) => card.additionalCosts![key])
			.reduce((a, b) => a + b, 0) >= 3
	);
};

export const canBeDiscoveredByClass = (card: ReferenceCard, currentClass: string | undefined): boolean => {
	if (!currentClass?.length) {
		// Can happen when we're not in a game
		// console.log('canBeDiscoveredByClass: no current class');
		// console.debug(new Error().stack);
		return true;
	}
	if (!card.classes?.length) {
		return true;
	}
	return card.classes.includes(currentClass.toUpperCase()) || card.classes.includes(CardClass[CardClass.NEUTRAL]);
};

export const fromAnotherClass = (card: ReferenceCard, currentClass: string | null | undefined): boolean => {
	if (!currentClass) {
		return false;
	}
	return (
		!card?.classes?.includes(CardClass[CardClass.NEUTRAL]) && !card?.classes?.includes(currentClass?.toUpperCase())
	);
};

export const getPlayerOrOpponentControllerEntity = (
	deckState: DeckState,
	gameState: GameState | null,
): EntityLike | undefined => {
	const playerId = deckState.isOpponent ? gameState?.opponentPlayerId : gameState?.localPlayerId;
	if (playerId == null) return undefined;
	return getControllerEntity(
		gameState?.parserState?.CurrentEntities,
		gameState?.parserState?.ControllerEntityMap,
		playerId,
	);
};

export const hasOverride = (
	result: readonly string[] | { override: true; cards: readonly string[] },
): result is {
	override: true;
	cards: readonly string[];
} => {
	return (result as { override: true; cards: readonly string[] })?.override;
};

export const hasCost = (
	card: ReferenceCard,
	operator: '==' | '<=' | '>=' | '<' | '>' = '==',
	value: number,
): boolean => {
	const cost = card?.cost ?? 0;
	switch (operator) {
		case '==':
			return cost === value;
		case '<=':
			return cost <= value;
		case '>=':
			return cost >= value;
		case '<':
			return cost < value;
		case '>':
			return cost > value;
		default:
			return false;
	}
};

export const hasAttack = (
	card: ReferenceCard,
	operator: '==' | '<=' | '>=' | '<' | '>' = '==',
	value: number,
): boolean => {
	const attack = card?.attack ?? 0;
	switch (operator) {
		case '==':
			return attack === value;
		case '<=':
			return attack <= value;
		case '>=':
			return attack >= value;
		case '<':
			return attack < value;
		case '>':
			return attack > value;
	}
};

export const hasHealth = (
	card: ReferenceCard,
	operator: '==' | '<=' | '>=' | '<' | '>' = '==',
	value: number,
): boolean => {
	const health = card?.health ?? 0;
	switch (operator) {
		case '==':
			return health === value;
		case '<=':
			return health <= value;
		case '>=':
			return health >= value;
		case '<':
			return health < value;
		case '>':
			return health > value;
	}
};

const canIncludeCthun = (
	refCard: ReferenceCard,
	initialDecklist: readonly string[] | undefined,
	currentClass: string | undefined,
	allCards: AllCardsService,
): boolean => {
	if (!refCard.mechanics?.includes('CTHUN')) {
		return true;
	}

	if (!initialDecklist?.length) {
		return false;
	}

	for (const cardId of initialDecklist) {
		const refCard = allCards.getCard(cardId);
		if (!refCard) {
			return true;
		}
		if (refCard.mechanics?.includes('CTHUN')) {
			return true;
		}
	}
	return false;
};

const canIncludeGalakrond = (
	refCard: ReferenceCard,
	initialDecklist: readonly string[] | undefined,
	currentClass: string | undefined,
	allCards: AllCardsService,
): boolean => {
	if (!refCard.mechanics?.includes('GALAKROND')) {
		return true;
	}

	if (!initialDecklist?.length) {
		return false;
	}

	for (const cardId of initialDecklist) {
		const refCard = allCards.getCard(cardId);
		if (!refCard) {
			return true;
		}
		if (refCard.mechanics?.includes('GALAKROND')) {
			return true;
		}
	}
	return false;
};

// Imbue cards cannot be generated unless the starting deck contains at least one imbue card
// https://www.reddit.com/r/hearthstone/comments/1reubn0/comment/o7kckv7
// https://www.reddit.com/r/hearthstone/comments/1reubn0/comment/o7nyg8p
const canIncludeImbue = (
	refCard: ReferenceCard,
	initialDecklist: readonly string[] | undefined,
	currentClass: string | undefined,
	allCards: AllCardsService,
): boolean => {
	if (!isImbueCard(refCard)) {
		return true;
	}

	if (!initialDecklist?.length) {
		if (!currentClass?.length) {
			return false;
		}
		// Non-imbue classes (Demon Hunter, Warlock, Warrior) can be safely assumed
		// to not have imbue cards in their deck
		return !NON_IMBUE_CLASSES.includes(CardClass[currentClass.toUpperCase()]);
	}

	for (const cardId of initialDecklist) {
		const deckCard = allCards.getCard(cardId);
		if (!deckCard) {
			continue;
		}
		if (isImbueCard(deckCard)) {
			return true;
		}
	}
	return false;
};

const NON_IMBUE_CLASSES = [CardClass.DEMONHUNTER, CardClass.WARLOCK, CardClass.WARRIOR];

const isImbueCard = (card: ReferenceCard): boolean => {
	return (
		!!card.mechanics?.includes(GameTag[GameTag.IMBUE]) || !!card.referencedTags?.includes(GameTag[GameTag.IMBUE])
	);
};

const canIncludeStarcraftFaction = (
	refCard: ReferenceCard,
	initialDecklist: readonly string[] | undefined,
	currentClass: string | undefined,
	allCards: AllCardsService,
): boolean => {
	// if (!initialDecklist?.length) {
	// 	return true;
	// }

	if (
		!refCard.mechanics?.includes(GameTag[GameTag.ZERG]) &&
		!refCard.mechanics?.includes(GameTag[GameTag.PROTOSS]) &&
		!refCard.mechanics?.includes(GameTag[GameTag.TERRAN])
	) {
		return true;
	}

	// https://x.com/RidiculousHat/status/1880304533978661025
	if (
		[CardIds.MissilePod_SC_409, CardIds.UltraCapacitor_SC_405, CardIds.YamatoCannon_SC_406].includes(
			refCard.id as CardIds,
		)
	) {
		return true;
	}

	const isZergOk =
		hasFaction(refCard, GameTag.ZERG) &&
		hasFactionInDecklist(initialDecklist, currentClass, GameTag.ZERG, allCards);
	const isProtossOk =
		hasFaction(refCard, GameTag.PROTOSS) &&
		hasFactionInDecklist(initialDecklist, currentClass, GameTag.PROTOSS, allCards);
	const isTerranOk =
		hasFaction(refCard, GameTag.TERRAN) &&
		hasFactionInDecklist(initialDecklist, currentClass, GameTag.TERRAN, allCards);
	return isZergOk || isProtossOk || isTerranOk;
};

const hasFaction = (card: ReferenceCard, faction: GameTag): boolean => {
	return card.mechanics?.includes(GameTag[faction]);
};

const hasFactionInDecklist = (
	decklist: readonly string[] | undefined,
	currentClass: string | undefined,
	faction: GameTag,
	allCards: AllCardsService,
): boolean => {
	if (!decklist?.length) {
		if (!currentClass?.length) {
			return false;
		}
		if (faction === GameTag.ZERG) {
			return [CardClass.DEATHKNIGHT, CardClass.DEMONHUNTER, CardClass.HUNTER, CardClass.WARLOCK].includes(
				CardClass[currentClass.toUpperCase()],
			);
		} else if (faction === GameTag.PROTOSS) {
			return [CardClass.DRUID, CardClass.MAGE, CardClass.PRIEST, CardClass.ROGUE].includes(
				CardClass[currentClass.toUpperCase()],
			);
		} else if (faction === GameTag.TERRAN) {
			return [CardClass.WARRIOR, CardClass.PALADIN, CardClass.SHAMAN].includes(
				CardClass[currentClass.toUpperCase()],
			);
		}
		return false;
	}
	for (const cardId of decklist) {
		const refCard = allCards.getCard(cardId);
		if (!refCard) {
			return true;
		}
		if (refCard.mechanics?.includes(GameTag[faction])) {
			return true;
		}
	}
	return false;
};

const doesSummonInPlay = (sourceCardId: string | null): boolean => {
	if (!sourceCardId) {
		return false;
	}
	const dynamicPoolImpl = cardsInfoCache[sourceCardId];
	if (hasDynamicPool(dynamicPoolImpl) && dynamicPoolImpl.summonInPlay === true) {
		return true;
	}
	return false;
};

const wantsColossalMinions = (sourceCardId: string | null): boolean => {
	switch (sourceCardId) {
		case CardIds.ClashOfTheColossals:
			return true;
		default:
			return false;
	}
};

// Helper function for excavate pool
const getExcavateTreasuresPool = (
	deckState: DeckState | undefined,
	playerClasses: readonly CardClass[],
): readonly string[] => {
	if (!deckState) {
		return [];
	}

	const maxTier = deckState.maxExcavateTier + 1;
	// The next tier the player will excavate to (1-indexed)
	const nextTier = (deckState.currentExcavateTier % maxTier) + 1;
	return buildExcavateTreasures(nextTier, playerClasses);
};
