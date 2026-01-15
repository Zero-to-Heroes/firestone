/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds } from '@firestone-hs/reference-data';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';

// Chromie, Bronze Emissary (TIME_103)
// "Discover a copy of a card you played this game."
export const ChromieBronzeEmissary: StaticGeneratingCard = {
	cardIds: [CardIds.Chromie_TIME_103],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		// Get all unique cards played this match by the player
		const playedCardIds = input.inputOptions.deckState.cardsPlayedThisMatch?.map((c) => c.cardId).filter((c) => !!c) ?? [];
		return [...new Set(playedCardIds)];
	},
};
