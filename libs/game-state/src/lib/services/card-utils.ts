/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable no-case-declarations */
import {
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
import { DeckCard, StoredInformation } from '../models/deck-card';
import { DeckState } from '../models/deck-state';
import { GeneratingCard } from './cards/_card.type';
import { cardsInfoCache } from './cards/_mapping';

export const getProcessedCard = (
	cardId: string,
	entityId: number,
	deckState: DeckState,
	allCards: CardsFacadeService,
	debug = false,
): ReferenceCard => {
	const refCard = allCards.getCard(cardId);
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

	return refCard;
};

export const getCost = (card: DeckCard, deckState: DeckState, allCards: CardsFacadeService): number | null => {
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
	return card?.getEffectiveManaCost?.() ?? card?.actualManaCost ?? card?.refManaCost ?? refCard.cost;
};

export const getCardType = (
	cardId: string,
	entityId: number,
	deckState: DeckState,
	allCards: CardsFacadeService,
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
	allCards: CardsFacadeService,
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
	},
): StoredInformation | null => {
	switch (cardId) {
		case CardIds.Robocaller_WORK_006:
			return {
				tagScriptValues: [
					tags.find((tag) => tag.Name === GameTag.TAG_SCRIPT_DATA_NUM_1)?.Value ?? null,
					tags.find((tag) => tag.Name === GameTag.TAG_SCRIPT_DATA_NUM_2)?.Value ?? null,
					tags.find((tag) => tag.Name === GameTag.TAG_SCRIPT_DATA_NUM_3)?.Value ?? null,
				],
			};
		case CardIds.ScrappyScavenger_TLC_461:
			return {
				manaLeftWhenPlayed: options?.manaLeft,
			};
		default:
			return null;
	}
};

export const addGuessInfoToCard = (
	card: DeckCard,
	creatorCardId: string,
	creatorEntityId: number,
	deckState: DeckState,
	allCards: CardsFacadeService,
	options?: {
		positionInHand?: number;
		tags?: readonly { Name: GameTag; Value: number }[];
	},
): DeckCard => {
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
			const guessedInfo = (
				cardsInfoCache[creatorCardId as keyof typeof cardsInfoCache] as GeneratingCard
			)?.guessInfo?.(deckState, allCards, creatorEntityId, options);
			return guessedInfo != null
				? card.update({
						guessedInfo: {
							...card.guessedInfo,
							...guessedInfo,
						},
					})
				: card;
	}
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
