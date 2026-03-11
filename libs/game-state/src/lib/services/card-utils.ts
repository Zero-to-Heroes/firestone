/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable no-case-declarations */
import {
	AllCardsService,
	CardClass,
	CardIds,
	CardType,
	GameFormat,
	GameTag,
	GameType,
	isValidSet,
	ReferenceCard,
	SetId,
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

export const getProcessedCard = (
	cardId: string | undefined | null,
	entityId: number | undefined | null,
	deckState: DeckState,
	allCards: CardsFacadeService | AllCardsService,
	debug = false,
): ReferenceCard => {
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
		const fullGameState = deckState.fullGameState;
		if (fullGameState) {
			const cardInState = fullGameState.AllEntities.find((c) => c.entityId === entityId);
			if (cardInState) {
				const updatedRefCard: Mutable<ReferenceCard> = { ...refCard };
				const newMechanics = [...(updatedRefCard.mechanics ?? [])];
				if (cardInState.tags?.some((t) => t.Name === GameTag.DEATHRATTLE && t.Value === 1)) {
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
 * possible SHATTERED cards (restricted to their class) when hovering over them.
 * TODO: this won't always be the case, as some classes can probably generate shattered cards from other classes
 */
const getShatteredPossibleCards = (
	deckState: DeckState,
	allCards: AllCardsService,
	guessedInfo: GuessedInfo,
): readonly string[] => {
	const cardClasses: readonly CardClass[] = guessedInfo?.cardClasses ?? [
		...[deckState.getCurrentClass()].filter((c) => !!c).map((c) => CardClass[c!]),
		CardClass.NEUTRAL,
	];
	console.debug('[debug] cardClasses', cardClasses);
	if (!cardClasses.length) {
		return [];
	}
	const result = allCards
		.getCards()
		.filter(
			(c) =>
				c.mechanics?.includes(GameTag[GameTag.SHATTERED]) && cardClasses.some((cc) => hasCorrectClass(c, cc)),
		)
		.map((c) => c.id)
		.filter((id): id is string => !!id);
	console.debug('[debug] result', result);
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
	options?: {
		positionInHand?: number;
		tags?: readonly { Name: GameTag; Value: number }[];
		metadata?: Metadata;
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
				const guessedInfo = cardImpl.guessInfo?.({
					card,
					deckState,
					opponentDeckState,
					gameState: gameState,
					allCards: allCards.getService(),
					creatorEntityId,
					options,
				});
				newGuessedInfo = {
					...card.guessedInfo,
					...guessedInfo,
				};
			}
	}

	// SHATTERED cards: when opponent draws a SHATTER card, two cards are created with SHATTERED tag.
	// We don't get creatorCardId from the parser, but we can show possible cards by class from the tag.
	const hasShatteredTag =
		options?.tags?.some((t) => t.Name === GameTag.SHATTERED && t.Value === 1) ||
		card.tags?.[GameTag.SHATTERED] === 1;
	if (hasShatteredTag) {
		const possibleCards = getShatteredPossibleCards(deckState, allCards.getService(), newGuessedInfo);
		console.debug('[debug] possibleCards', possibleCards);
		if (possibleCards.length > 0) {
			// The first card is created in the SETASIDE zone, then moved to hand, so the createdIndex is not present
			if (card.createdIndex === 0 || !card.createdIndex) {
				newGuessedInfo = {
					...card.guessedInfo,
					possibleCards: possibleCards.filter((c, index) => index % 2 === 0),
				};
			} else if (card.createdIndex === 1) {
				newGuessedInfo = {
					...card.guessedInfo,
					possibleCards: possibleCards.filter((c, index) => index % 2 === 1),
				};
			}
		}
	}
	console.debug('[debug] newGuessedInfo', newGuessedInfo, card);

	return card.update({
		guessedInfo: newGuessedInfo,
	});
};

export const getPossibleForgedCards = (
	format: GameFormat,
	gameType: GameType,
	inputCardClasses: readonly CardClass[],
	allCards: CardsFacadeService,
): readonly string[] => {
	const cardClasses = [...(inputCardClasses ?? []), CardClass.NEUTRAL];
	return allCards
		.getCards()
		.filter((c) => (!!c.set ? isValidSet(c.set.toLowerCase() as SetId, format, gameType) : false))
		.filter((c) => c.mechanics?.includes(GameTag[GameTag.FORGE]))
		.filter((c) => c.classes?.some((cc) => cardClasses.includes(CardClass[cc])))
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
