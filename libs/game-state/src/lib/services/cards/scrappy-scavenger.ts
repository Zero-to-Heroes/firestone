/* eslint-disable no-mixed-spaces-and-tabs */
// Scrappy Scavenger (TLC_461)
// "Discover a card with Cost equal to the amount of Mana you have left."

import { CardIds, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { canBeDiscoveredByClass, hasCost } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const targetCostFor = (input: {
	entityId: number;
	cardId: string;
	allCards: StaticGeneratingCardInput['allCards'];
	deckState: StaticGeneratingCardInput['inputOptions']['deckState'];
}): number => {
	const creatorEntityId = input.deckState.findCard(input.entityId)?.card?.creatorEntityId;
	const card = input.deckState.findCard(creatorEntityId)?.card;
	const cardCost = card?.getEffectiveManaCost() ?? input.allCards.getCard(input.cardId)?.cost ?? 0;
	const hasBeenPlayed = card?.storedInformation?.manaLeftWhenPlayed != null;
	return hasBeenPlayed
		? card.storedInformation.manaLeftWhenPlayed!
		: Math.min(10, Math.max(0, (input.deckState.manaLeft ?? 0) - cardCost));
};

export const ScrappyScavenger: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.ScrappyScavenger_TLC_461],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		const targetCost = targetCostFor({
			entityId: input.entityId,
			cardId: input.cardId,
			allCards: input.allCards,
			deckState: input.inputOptions.deckState,
		});
		return filterCards(
			ScrappyScavenger.cardIds[0],
			input.allCards,
			(c: ReferenceCard) =>
				hasCost(c, '==', targetCost) && canBeDiscoveredByClass(c, input.inputOptions.currentClass),
			input.inputOptions,
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const targetCost = targetCostFor({
			entityId: input.card.entityId ?? 0,
			cardId: ScrappyScavenger.cardIds[0],
			allCards: input.allCards,
			deckState: input.deckState,
		});
		return {
			cost: targetCost,
			possibleCards: filterCards(
				ScrappyScavenger.cardIds[0],
				input.allCards,
				(c: ReferenceCard) =>
					hasCost(c, '==', targetCost) && canBeDiscoveredByClass(c, input.options.currentClass),
				input.options,
			),
		};
	},
};
