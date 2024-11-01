/* eslint-disable no-case-declarations */
import { CardIds, GameTag, ReferenceCard } from '@firestone-hs/reference-data';
import { Mutable } from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { DeckCard, StoredInformation } from '../models/deck-card';
import { DeckState } from '../models/deck-state';

export const getProcessedCard = (cardId: string, deckState: DeckState, allCards: CardsFacadeService): ReferenceCard => {
	const refCard: Mutable<ReferenceCard> = allCards.getCard(cardId);
	if (cardId?.startsWith(CardIds.ZilliaxDeluxe3000_TOY_330)) {
		const sideboard = deckState.sideboards?.find((s) => s.keyCardId === cardId);
		// Remove the cosmetic module
		const modules = sideboard?.cards?.map((c) => allCards.getCard(c)).filter((c) => c.health) ?? [];
		refCard.mechanics = refCard.mechanics ?? [];
		refCard.mechanics.push(...modules.flatMap((m) => m.mechanics ?? []));
		refCard.attack = modules.reduce((a, b) => a + (b.attack ?? 0), refCard.attack ?? 0);
		refCard.health = modules.reduce((a, b) => a + (b.health ?? 0), refCard.health ?? 0);
		refCard.cost = modules.reduce((a, b) => a + (b.cost ?? 0), refCard.cost ?? 0);
	}
	return refCard;
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
		default:
			return card;
	}
};
