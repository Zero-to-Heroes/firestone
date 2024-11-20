/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable no-case-declarations */
import {
	CardClass,
	CardIds,
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
import { GeneratingCard, UpdatingCard } from './cards/_card.type';
import { cardsInfoCache } from './cards/_mapping';

export const getProcessedCard = (
	cardId: string,
	entityId: number,
	deckState: DeckState,
	allCards: CardsFacadeService,
): ReferenceCard => {
	const refCard = allCards.getCard(cardId);
	if (cardId?.startsWith(CardIds.ZilliaxDeluxe3000_TOY_330)) {
		const updatedRefCard: Mutable<ReferenceCard> = { ...refCard };
		const sideboard = deckState.sideboards?.find((s) => s.keyCardId.startsWith(CardIds.ZilliaxDeluxe3000_TOY_330));
		// Remove the cosmetic module
		const modules = sideboard?.cards?.map((c) => allCards.getCard(c)).filter((c) => c.health) ?? [];
		updatedRefCard.mechanics = [...(updatedRefCard.mechanics ?? [])];
		updatedRefCard.mechanics.push(...modules.flatMap((m) => m.mechanics ?? []));
		updatedRefCard.attack = modules.reduce((a, b) => a + (b.attack ?? 0), 0);
		updatedRefCard.health = modules.reduce((a, b) => a + (b.health ?? 0), 0);
		updatedRefCard.cost = modules.reduce((a, b) => a + (b.cost ?? 0), 0);
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
	const refCard = allCards.getCard(card.cardId);
	const isStarship = refCard.mechanics?.includes(GameTag[GameTag.STARSHIP]);
	if (isStarship) {
		const pieces =
			card?.storedInformation?.cards
				?.map((c) => allCards.getCard(c?.cardId))
				.filter((c) => c.mechanics?.includes(GameTag[GameTag.STARSHIP_PIECE])) ?? [];
		const cost = pieces.reduce((a, b) => a + (b.cost ?? 0), 0);
		console.debug('[card-utils] computed cost for starship', refCard.name, pieces, cost, card);
		return cost;
	}
	return card?.getEffectiveManaCost();
};

export const storeInformationOnCardPlayed = (
	cardId: string,
	tags: readonly { Name: GameTag; Value: number }[],
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
		default:
			return null;
	}
};

export const addGuessInfoToDrawnCard = (
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
		case CardIds.Robocaller_WORK_006:
			const tagScripts = deckState.findCard(creatorEntityId)?.card?.storedInformation?.tagScriptValues;
			// WARNING: mutable data
			const nextCost = tagScripts?.shift();
			return card.update({
				guessedInfo: {
					...card.guessedInfo,
					cost: nextCost,
				},
			});
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

export const addGuessInfoToCardInHand = (
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
		default:
			const guessedInfo = (
				cardsInfoCache[creatorCardId as keyof typeof cardsInfoCache] as UpdatingCard
			)?.updateGuessInfo(deckState, allCards, creatorEntityId, options);
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
