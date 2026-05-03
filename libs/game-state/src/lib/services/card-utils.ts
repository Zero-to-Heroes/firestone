/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable no-case-declarations */
import {
	AllCardsService,
	arenaSets,
	CardClass,
	CardIds,
	CardType,
	GameFormat,
	GameTag,
	GameType,
	ReferenceCard,
	SetId,
	standardSets,
	twistSets,
	wildSets,
	Zone,
} from '@firestone-hs/reference-data';
import { Mutable } from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { DeckCard, GuessedInfo, StoredInformation } from '../models/deck-card';
import { DeckState } from '../models/deck-state';
import { GameState } from '../models/game-state';
import { Metadata } from '../models/metadata';
import { hasCorrectClass } from '../related-cards/dynamic-pools';
import { hasGeneratingCard } from './cards/_card.type';
import { cardsInfoCache } from './cards/_mapping';
import { EntityLike, hasTag } from './parser-entity-utils';

export const getProcessedCard = (
	cardId: string | undefined | null,
	entityId: number | undefined | null,
	deckState: DeckState,
	allCards: CardsFacadeService | AllCardsService,
	debugOrCurrentEntities?: boolean | Map<number, EntityLike>,
): ReferenceCard => {
	const currentEntities = debugOrCurrentEntities instanceof Map ? debugOrCurrentEntities : undefined;
	const refCard = allCards.getCard(cardId!);
	if (cardId?.startsWith(CardIds.ZilliaxDeluxe3000_TOY_330)) {
		const updatedRefCard: Mutable<ReferenceCard> = { ...refCard };
		const sideboard = deckState.sideboards?.find((s) => s.keyCardId.startsWith(CardIds.ZilliaxDeluxe3000_TOY_330));
		// Remove the cosmetic module
		const modules = sideboard?.cards?.map((c) => allCards.getCard(c)).filter((c) => c.health) ?? [];
		if (modules.length > 0) {
			updatedRefCard.mechanics = [...(updatedRefCard.mechanics ?? [])];
			updatedRefCard.mechanics.push(...modules.flatMap((m) => m.mechanics ?? []));
			updatedRefCard.attack = modules.reduce((a, b) => a + (b.attack ?? 0), 0);
			updatedRefCard.health = modules.reduce((a, b) => a + (b.health ?? 0), 0);
			updatedRefCard.cost = modules.reduce((a, b) => a + (b.cost ?? 0), 0);
		} else {
			const cardInDeck = deckState.findCard(entityId)?.card;
			updatedRefCard.attack = cardInDeck?.tags?.[GameTag.ATK] ?? updatedRefCard.attack;
			updatedRefCard.health = cardInDeck?.tags?.[GameTag.HEALTH] ?? updatedRefCard.health;
			updatedRefCard.cost = cardInDeck?.tags?.[GameTag.COST] ?? updatedRefCard.cost;
		}
		return updatedRefCard;
	}
	const isStarship = refCard.mechanics?.includes(GameTag[GameTag.STARSHIP]);
	if (isStarship) {
		const starshipCard = deckState.findCard(entityId)?.card;
		// TODO: if a piece is buffed, we need to use its actual attack / health / cost instead of the ref values
		const pieces =
			starshipCard?.storedInformation?.cards
				?.map((c) => allCards.getCard(c?.cardId))
				.filter((c) => c.mechanics?.includes(GameTag[GameTag.STARSHIP_PIECE])) ?? [];
		const updatedRefCard: Mutable<ReferenceCard> = { ...refCard };
		updatedRefCard.mechanics = [...(updatedRefCard.mechanics ?? [])];
		updatedRefCard.mechanics.push(...pieces.flatMap((m) => m.mechanics ?? []));
		updatedRefCard.attack = pieces.reduce((a, b) => a + (b.attack ?? 0), 0);
		updatedRefCard.health = pieces.reduce((a, b) => a + (b.health ?? 0), 0);
		updatedRefCard.cost = pieces.reduce((a, b) => a + (b.cost ?? 0), 0);
		return updatedRefCard;
	}

	const isEliseLocation =
		refCard.id?.startsWith(CardIds.EliseTheNavigator_TLC_100) && refCard.id !== CardIds.EliseTheNavigator_TLC_100;
	const isIgnisWeapon = refCard.id?.startsWith('TTN_060');
	if (isEliseLocation || isIgnisWeapon) {
		if (currentEntities && entityId != null) {
			const cardInState = currentEntities.get(entityId);
			if (cardInState) {
				const updatedRefCard: Mutable<ReferenceCard> = { ...refCard };
				const newMechanics = [...(updatedRefCard.mechanics ?? [])];
				if (hasTag(cardInState.Tags, GameTag.DEATHRATTLE)) {
					newMechanics.push(GameTag[GameTag.DEATHRATTLE]);
				}
				updatedRefCard.mechanics = newMechanics;
				return updatedRefCard;
			}
		}
	}
	return refCard;
};

export const getCost = (card: DeckCard, deckState: DeckState, allCards: CardsFacadeService): number => {
	const refCard = getProcessedCard(card.cardId, card.entityId, deckState, allCards);
	const isStarship = refCard.mechanics?.includes(GameTag[GameTag.STARSHIP]);
	if (isStarship) {
		const pieces =
			card?.storedInformation?.cards
				?.map((c) => allCards.getCard(c?.cardId))
				.filter((c) => c.mechanics?.includes(GameTag[GameTag.STARSHIP_PIECE])) ?? [];
		const cost = pieces.reduce((a, b) => a + (b.cost ?? 0), 0);
		return cost;
	}
	return card?.getEffectiveManaCost?.() ?? card?.actualManaCost ?? card?.refManaCost ?? refCard.cost ?? 0;
};

export const getCardType = (
	cardId: string,
	entityId: number,
	deckState: DeckState,
	allCards: CardsFacadeService | AllCardsService,
): CardType | null => {
	const refCard = getProcessedCard(cardId, entityId, deckState, allCards);
	if (refCard?.type) {
		return CardType[refCard.type.toUpperCase()];
	}

	if (refCard.tags?.[GameTag.CARDTYPE]) {
		return refCard.tags[GameTag.CARDTYPE];
	}

	const cardFromDeck = deckState.findCard(entityId)?.card;
	if (cardFromDeck?.cardType) {
		return CardType[cardFromDeck.cardType.toUpperCase()];
	}

	if (cardFromDeck?.tags?.[GameTag.CARDTYPE]) {
		return cardFromDeck.tags[GameTag.CARDTYPE];
	}

	return null;
};

export const getCardId = (
	cardId: string,
	entityId: number,
	deckState: DeckState,
	allCards: CardsFacadeService | AllCardsService,
): string | null => {
	const refCard = getProcessedCard(cardId, entityId, deckState, allCards);
	if (refCard?.id) {
		return refCard.id;
	}

	const cardFromDeck = deckState.findCard(entityId)?.card;
	if (cardFromDeck?.cardId) {
		return cardFromDeck.cardId;
	}

	return null;
};

export const storeInformationOnCardPlayed = (
	cardId: string,
	tags: readonly { Name: GameTag; Value: number }[],
	options?: {
		manaLeft?: number | null;
		deckState?: DeckState;
		gameTagTurnNumber?: number;
		targetCardId?: string | null;
		targetEntityId?: number | null;
	},
): StoredInformation | null => {
	let result: StoredInformation | null = null;
	switch (cardId) {
		case CardIds.Robocaller_WORK_006:
			result = {
				tagScriptValues: [
					tags.find((tag) => tag.Name === GameTag.TAG_SCRIPT_DATA_NUM_1)?.Value ?? null,
					tags.find((tag) => tag.Name === GameTag.TAG_SCRIPT_DATA_NUM_2)?.Value ?? null,
					tags.find((tag) => tag.Name === GameTag.TAG_SCRIPT_DATA_NUM_3)?.Value ?? null,
				],
			};
			break;
		case CardIds.ScrappyScavenger_TLC_461:
			result = {
				manaLeftWhenPlayed: options?.manaLeft,
			};
			break;
		case CardIds.RuniTemporalGuardian_TIME_EVENT_998:
			result = {
				cards: options?.deckState?.hand?.map((c) => ({ cardId: c.cardId, entityId: c.entityId })),
				gameTagTurnNumberPlayed: options?.gameTagTurnNumber,
			};
			break;
	}

	const hasTargetInfo = !!options?.targetCardId || (options?.targetEntityId != null && options.targetEntityId > 0);
	if (hasTargetInfo) {
		return {
			...result,
			...(options?.targetCardId ? { targetCardId: options.targetCardId } : {}),
			...(options?.targetEntityId != null && options.targetEntityId > 0
				? { targetEntityId: options.targetEntityId }
				: {}),
		};
	}

	return result;
};

/**
 * When the opponent draws a SHATTER card, it splits into two SHATTERED cards in their hand.
 * These cards have the SHATTERED tag but no cardId (hidden). This allows showing the list of
 * possible SHATTERED cards (restricted to their class, or to `guessedInfo.cardClasses` from the creator)
 * when hovering over them.
 */
export const getShatteredPossibleCards = (
	deckState: DeckState,
	allCards: AllCardsService,
	guessedInfo: GuessedInfo,
): readonly string[] => {
	const cardClasses: readonly CardClass[] = guessedInfo?.canBeAnyCardClass
		? []
		: (guessedInfo?.cardClasses ?? [deckState.getCurrentClassEnum() ?? CardClass.NEUTRAL]);
	// // console.debug('cardClasses', cardClasses);
	// if (!cardClasses.length) {
	// 	return [];
	// }
	let result: readonly string[] = allCards
		.getCards()
		.filter(
			(c) =>
				c.mechanics?.includes(GameTag[GameTag.SHATTERED]) &&
				(!cardClasses.length || cardClasses.some((cc) => hasCorrectClass(c, cc))),
		)
		.map((c) => c.id)
		.filter((id): id is string => !!id);
	if (!result.length) {
		result = allCards
			.getCards()
			.filter((c) => c.mechanics?.includes(GameTag[GameTag.SHATTERED]))
			.map((c) => c.id)
			.filter((id): id is string => !!id);
	}
	// console.debug(
	// 	'result',
	// 	result,
	// 	allCards.getCards().filter((c) => c.mechanics?.includes(GameTag[GameTag.SHATTERED])),
	// 	allCards
	// 		.getCards()
	// 		.filter(
	// 			(c) =>
	// 				c.mechanics?.includes(GameTag[GameTag.SHATTERED]) &&
	// 				cardClasses.some((cc) => hasCorrectClass(c, cc)),
	// 		),
	// );
	return result;
};

export const getShatteredRecombinedPossibleCards = (
	deckState: DeckState,
	allCards: AllCardsService,
	guessedInfo: GuessedInfo,
): readonly string[] => {
	const cardClasses: readonly CardClass[] = guessedInfo?.canBeAnyCardClass
		? []
		: (guessedInfo?.cardClasses ?? [deckState.getCurrentClassEnum() ?? CardClass.NEUTRAL]);
	// // console.debug('cardClasses', cardClasses);
	// if (!cardClasses.length) {
	// 	return [];
	// }
	let result: readonly string[] = allCards
		.getCards()
		.filter(
			(c) =>
				c.mechanics?.includes(GameTag[GameTag.SHATTER]) &&
				(!cardClasses.length || cardClasses.some((cc) => hasCorrectClass(c, cc))),
		)
		.map((c) => c.id)
		.filter((id): id is string => !!id);
	if (!result.length) {
		result = allCards
			.getCards()
			.filter((c) => c.mechanics?.includes(GameTag[GameTag.SHATTER]))
			.map((c) => c.id)
			.filter((id): id is string => !!id);
	}
	// console.debug(
	// 	'result',
	// 	result,
	// 	allCards.getCards().filter((c) => c.mechanics?.includes(GameTag[GameTag.SHATTERED])),
	// 	allCards
	// 		.getCards()
	// 		.filter(
	// 			(c) =>
	// 				c.mechanics?.includes(GameTag[GameTag.SHATTERED]) &&
	// 				cardClasses.some((cc) => hasCorrectClass(c, cc)),
	// 		),
	// );
	return result;
};

export const addGuessInfoToCard = (
	card: DeckCard,
	creatorCardId: string,
	creatorEntityId: number | null,
	deckState: DeckState,
	opponentDeckState: DeckState,
	gameState: GameState,
	allCards: CardsFacadeService,
	options: {
		positionInHand?: number;
		creatorZone?: Zone | null;
		tags?: readonly { Name: GameTag; Value: number }[];
		metadata?: Metadata;
		validArenaPool: readonly string[];
		creatorTags?: readonly { Name: GameTag; Value: number }[];
		currentClass?: string;
		initialDecklist?: readonly string[];
	},
): DeckCard => {
	if (card.cardId) {
		return card;
	}
	let newGuessedInfo: GuessedInfo | null = card.guessedInfo;
	switch (creatorCardId) {
		case CardIds.HarthStonebrew_CORE_GIFT_01:
		case CardIds.HarthStonebrew_GIFT_01:
			return card.update({
				creatorAdditionalInfo: options?.positionInHand,
			});
		// Disable this, as if one card isn't drawn (eg no 7-cost card in deck), we have no way to know
		// and would display incorrect info
		// case CardIds.Robocaller_WORK_006:
		// 	const tagScripts = deckState.findCard(creatorEntityId)?.card?.storedInformation?.tagScriptValues;
		// 	// WARNING: mutable data
		// 	const nextCost = tagScripts?.shift();
		// 	return card.update({
		// 		guessedInfo: {
		// 			...card.guessedInfo,
		// 			cost: nextCost,
		// 		},
		// 	});
		default:
			const cardImpl = cardsInfoCache[creatorCardId];
			if (hasGeneratingCard(cardImpl)) {
				const optionsWithDeckContext = {
					...options,
					currentClass: options.currentClass ?? deckState.getCurrentClass(),
					initialDecklist: options.initialDecklist ?? deckState.deckList?.map((c) => c.cardId) ?? [],
				};
				const guessedInfo = cardImpl.guessInfo?.({
					card,
					deckState,
					opponentDeckState,
					gameState: gameState,
					allCards: allCards.getService(),
					creatorEntityId,
					options: optionsWithDeckContext,
				});
				newGuessedInfo = {
					...card.guessedInfo,
					...guessedInfo,
				};
			}
	}

	// SHATTERED cards: hidden hand pieces after a SHATTER; class filter uses deck class unless the
	// creator's GeneratingCard.guessInfo already set cardClasses (see Spark of Life).
	const hasShatteredTag =
		options?.tags?.some((t) => t.Name === GameTag.SHATTERED && t.Value === 1) ||
		card.tags?.[GameTag.SHATTERED] === 1;
	if (hasShatteredTag) {
		const possibleCards = getShatteredPossibleCards(deckState, allCards.getService(), newGuessedInfo ?? {});
		if (possibleCards.length > 0) {
			// Even/odd halves of the global SHATTERED list. createdIndex sequences all spawns from the
			// source (e.g. Spark of Life may use 0–1 for setaside tokens before hand pieces get 2 and 3).
			// When createdIndex is missing for both hand pieces (common for Tigress Plushy / generic shatter),
			// defaulting to "first half" for both made both markers show the same art — use hand order
			// among SHATTERED entities (including this card before it is appended to deckState.hand).
			let useFirstHalf: boolean;
			if (card.createdIndex != null && card.createdIndex >= 0) {
				useFirstHalf = card.createdIndex % 2 === 0;
			} else {
				const peers: DeckCard[] = [
					...deckState.hand.filter((c) => c.tags?.[GameTag.SHATTERED] === 1 && !c.cardId?.length),
				];
				if (!peers.some((c) => c.entityId === card.entityId)) {
					peers.push(card);
				}
				peers.sort((a, b) => (a.tags?.[GameTag.ZONE_POSITION] ?? 0) - (b.tags?.[GameTag.ZONE_POSITION] ?? 0));
				const shardIdx = peers.findIndex((c) => c.entityId === card.entityId);
				useFirstHalf = shardIdx >= 0 ? shardIdx % 2 === 0 : true;
			}
			newGuessedInfo = {
				...newGuessedInfo,
				possibleCards: possibleCards.filter((c, index) => (useFirstHalf ? index % 2 === 0 : index % 2 === 1)),
				mechanics: [...(newGuessedInfo?.mechanics ?? []), GameTag.SHATTERED],
			};
		}
	}

	return card.update({
		guessedInfo: newGuessedInfo,
	});
};

export const getPossibleForgedCards = (
	format: GameFormat,
	gameType: GameType,
	cardClasses: readonly CardClass[],
	allCards: CardsFacadeService,
	curatedPools: {
		arena: readonly string[];
	},
): readonly string[] => {
	const result = allCards
		.getCards()
		.filter((c) => (!!c.set ? isCardValidForGame(c, format, gameType, curatedPools) : false))
		.filter((c) => c.mechanics?.includes(GameTag[GameTag.FORGE]))
		.filter((c) => !cardClasses.length || c.classes?.some((cc) => cardClasses.includes(CardClass[cc])))
		.map((c) => allCards.getCard(c.relatedCardDbfIds?.[0] ?? 0))
		.filter((c) => !!c.id)
		.sort((a, b) => (a.cost ?? 0) - (b.cost ?? 0) || a.name.localeCompare(b.name))
		.sort((a, b) => {
			if (a.classes![0] === CardClass[CardClass.NEUTRAL]) {
				return 1;
			}
			if (b.classes![0] === CardClass[CardClass.NEUTRAL]) {
				return -1;
			}
			return a.classes![0]?.localeCompare(b.classes![0]);
		})
		.map((c) => c.id);
	console.debug(
		'[getPossibleForgedCards] result',
		result,
		cardClasses,
		format,
		gameType,
		allCards.getCards().filter((c) => c.mechanics?.includes(GameTag[GameTag.FORGE])),
	);
	return result;
};

export const isCardValidForGame = (
	card: ReferenceCard,
	format: GameFormat,
	gameType: GameType,
	curatedPools?: {
		arena: readonly string[];
	},
): boolean => {
	const set = card.set?.toLowerCase() as SetId;
	switch (gameType) {
		case GameType.GT_ARENA:
		case GameType.GT_UNDERGROUND_ARENA:
			if (arenaSets.length === 0) {
				if (curatedPools?.arena?.length) {
					return curatedPools.arena.includes(card.id);
				}
				// Fallback and use wild pool
				return wildSets.includes(set);
			} else {
				return arenaSets.includes(set);
			}
	}
	switch (format) {
		case GameFormat.FT_STANDARD:
			return standardSets.includes(set);
		case GameFormat.FT_TWIST:
			return twistSets.includes(set);
		case GameFormat.FT_WILD:
		default:
			return wildSets.includes(set);
	}
};

export const isTakePlaceOnBoard = (card: ReferenceCard): boolean => {
	return (
		card.type != null &&
		[CardType.MINION, CardType.LOCATION, CardType.BATTLEGROUND_HERO_BUDDY].includes(
			CardType[card.type.toUpperCase()],
		)
	);
};

export const timeRafaamFablePackage = [
	CardIds.TimethiefRafaam_TIME_005,
	CardIds.TimethiefRafaam_TinyRafaamToken_TIME_005t1,
	CardIds.TimethiefRafaam_GreenRafaamToken_TIME_005t2,
	CardIds.TimethiefRafaam_MurlocRafaamToken_TIME_005t8,
	CardIds.TimethiefRafaam_ExplorerRafaamToken_TIME_005t3,
	CardIds.TimethiefRafaam_WarchiefRafaamToken_TIME_005t4,
	CardIds.TimethiefRafaam_CalamitousRafaamToken_TIME_005t6,
	CardIds.TimethiefRafaam_MindflayerRfaamToken_TIME_005t5,
	CardIds.TimethiefRafaam_GiantRafaamToken_TIME_005t7,
	CardIds.TimethiefRafaam_ArchmageRafaamToken_TIME_005t9,
];
export const broxigarFablePackage = [
	CardIds.Broxigar_TIME_020,
	CardIds.Broxigar_FirstPortalToArgusToken_TIME_020t2,
	CardIds.Broxigar_AxeOfCenariusToken_TIME_020t1,
];
export const kingLlaneFablePackage = [
	CardIds.GaronaHalforcen_TIME_875,
	CardIds.GaronaHalforcen_KingLlaneToken_TIME_875t,
	CardIds.GaronaHalforcen_TheKingslayersToken_TIME_875t1,
];
export const windrunnerSistersFablePackage = [
	CardIds.RangerGeneralSylvanas_TIME_609,
	CardIds.RangerGeneralSylvanas_RangerCaptainAlleriaToken_TIME_609t1,
	CardIds.RangerGeneralSylvanas_RangerInitiateVereesaToken_TIME_609t2,
];
export const fablePackages = [
	[
		CardIds.TalanjiOfTheGraves_TIME_619,
		CardIds.TalanjiOfTheGraves_WhatBefellZandalarToken_TIME_619t2,
		CardIds.TalanjiOfTheGraves_BwonsamdiToken_TIME_619t,
	],
	[
		CardIds.LadyAzshara_TIME_211,
		CardIds.LadyAzshara_TheWellOfEternityToken_TIME_211t1,
		CardIds.LadyAzshara_ZinAzshariToken_TIME_211t2,
	],
	[
		CardIds.AzureQueenSindragosa_TIME_852,
		CardIds.AzureQueenSindragosa_AzureKingMalygosToken_TIME_852t1,
		CardIds.AzureQueenSindragosa_AzureOathstoneToken_TIME_852t3,
	],
	[
		CardIds.GelbinOfTomorrow_TIME_009,
		CardIds.GelbinOfTomorrow_GnomishAuraToken_TIME_009t1,
		CardIds.GelbinOfTomorrow_MekkatorquesAuraToken_TIME_009t2,
	],
	[
		CardIds.MedivhTheHallowed_TIME_890,
		CardIds.MedivhTheHallowed_KarazhanTheSanctumToken_TIME_890t2,
		CardIds.MedivhTheHallowed_AtieshTheGreatstaffToken_TIME_890t,
	],
	[
		CardIds.MuradinHighKing_TIME_209,
		CardIds.MuradinHighKing_AvatarFormToken_TIME_209t2,
		CardIds.MuradinHighKing_HighKingsHammerToken_TIME_209t,
	],
	[
		CardIds.LogoshBloodFighter_TIME_850,
		CardIds.LogoshBloodFighter_BrollBloodFighterToken_TIME_850t,
		CardIds.LogoshBloodFighter_ValeeraBloodFighterToken_TIME_850t1,
	],
	kingLlaneFablePackage,
	timeRafaamFablePackage,
	broxigarFablePackage,
	windrunnerSistersFablePackage,
];

export const isTreant = (cardId: string, allCards: CardsFacadeService): boolean => {
	return allCards.getCard(cardId)?.isTreant ?? false;
};

export const isDormant = (card: DeckCard, currentEntities?: Map<number, EntityLike>): boolean => {
	return (
		card.tags?.[GameTag.DORMANT] === 1 ||
		(currentEntities &&
			currentEntities.get(card.entityId)?.Tags?.some((t) => t.Name === GameTag.DORMANT && t.Value === 1)) ||
		false
	);
};
