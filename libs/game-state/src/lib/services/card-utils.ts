/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable no-case-declarations */
import {
	CardClass,
	CardIds,
	GameFormat,
	GameTag,
	isValidSet,
	ReferenceCard,
	SetId,
} from '@firestone-hs/reference-data';
import { Mutable } from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { DeckCard, StoredInformation } from '../models/deck-card';
import { DeckState } from '../models/deck-state';

export const getProcessedCard = (cardId: string, deckState: DeckState, allCards: CardsFacadeService): ReferenceCard => {
	if (cardId?.startsWith(CardIds.ZilliaxDeluxe3000_TOY_330)) {
		const updatedRefCard: Mutable<ReferenceCard> = { ...allCards.getCard(cardId) };
		console.debug('[debug] adding modules to Zilliax', cardId, updatedRefCard);
		const sideboard = deckState.sideboards?.find((s) => s.keyCardId.startsWith(CardIds.ZilliaxDeluxe3000_TOY_330));
		console.debug('[debug] sideboard', sideboard);
		// Remove the cosmetic module
		const modules = sideboard?.cards?.map((c) => allCards.getCard(c)).filter((c) => c.health) ?? [];
		console.debug('[debug] modules', modules);
		updatedRefCard.mechanics = [...(updatedRefCard.mechanics ?? [])];
		updatedRefCard.mechanics.push(...modules.flatMap((m) => m.mechanics ?? []));
		updatedRefCard.attack = modules.reduce((a, b) => a + (b.attack ?? 0), 0);
		updatedRefCard.health = modules.reduce((a, b) => a + (b.health ?? 0), 0);
		updatedRefCard.cost = modules.reduce((a, b) => a + (b.cost ?? 0), 0);
		console.debug('[debug] updated refCard', updatedRefCard);
		return updatedRefCard;
	}
	return allCards.getCard(cardId);
};

// Ideally I would access the tag information directly from the card, but the way the parser works today
// (keep the "real" state on the parser, and only send events) this is not possible
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
): DeckCard => {
	switch (creatorCardId) {
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
		case CardIds.DirdraRebelCaptain_GDB_117:
			const allCrewmates =
				allCards.getCard(creatorCardId).relatedCardDbfIds?.map((dbfId) => allCards.getCard(dbfId)?.id) ?? [];
			const crewmatesLeftInDeck = allCrewmates.filter((crewmate) =>
				deckState
					.getAllCardsInDeck()
					.map((c) => c.cardId)
					.includes(crewmate),
			);
			console.debug(
				'[debug] crewmatesLeftInDeck',
				crewmatesLeftInDeck,
				allCrewmates,
				deckState,
				allCards.getCard(creatorCardId),
			);
			return card.update({
				guessedInfo: {
					...card.guessedInfo,
					possibleCards: crewmatesLeftInDeck,
				},
			});
		default:
			return card;
	}
};

export const getPossibleForgedCards = (
	format: GameFormat,
	inputCardClasses: readonly CardClass[],
	allCards: CardsFacadeService,
): readonly string[] => {
	const cardClasses = [...(inputCardClasses ?? []), CardClass.NEUTRAL];
	console.debug(
		'[debug] getPossibleForgedCards',
		format,
		cardClasses,
		allCards
			.getCards()
			.filter((c) => (!!c.set ? isValidSet(c.set.toLowerCase() as SetId, format) : false))
			.filter((c) => c.mechanics?.includes(GameTag[GameTag.FORGE]))
			.filter((c) => c.classes?.some((cc) => cardClasses.includes(CardClass[cc])))
			.map((c) => allCards.getCard(c.relatedCardDbfIds?.[0] ?? 0)?.id),
	);
	return allCards
		.getCards()
		.filter((c) => (!!c.set ? isValidSet(c.set.toLowerCase() as SetId, format) : false))
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
