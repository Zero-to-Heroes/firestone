/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Godfreythe Betrayer (JAIL_509)
 * Start of Game: Overdrawn cards return to your hand when you have space. They cost (1) less.
 */
import { CardIds } from '@firestone-hs/reference-data';

import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';

export const GodfreytheBetrayer: StaticGeneratingCard & GeneratingCard = {
	cardIds: [
		CardIds.GodfreytheBetrayer_JAIL_509,
		CardIds.GodfreyTheBetrayer_GodfreysAtlasEnchantment_JAIL_509e,
	],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		const overdrawnCards = input.inputOptions.deckState.burnedCards;
		const deckState = input.inputOptions.deckState;
		const returnedCardsThatHaveBeenPlayed = deckState.cardsPlayedThisMatch
			.map((c) => deckState.findCard(c.entityId)?.card)
			.filter(
				(c) =>
					!!c?.cardId &&
					c.creatorCardId === CardIds.GodfreyTheBetrayer_GodfreysAtlasEnchantment_JAIL_509e,
			);

		// Remove cards that we know have been returned already. Take care of duplicates - if the card has been burned twice,
		// and the returnedPlayed has been played once, we should still send back the card once.
		const candidates = overdrawnCards.map((c) => c.cardId);
		for (const card of returnedCardsThatHaveBeenPlayed) {
			const index = candidates.indexOf(card!.cardId);
			if (index !== -1) {
				candidates.splice(index, 1);
			}
		}

		return candidates;
	},
	// Apparently, it returns them at random, so we can't know which is which
	guessInfo: (input: GuessInfoInput) => {
		const overdrawnCards = input.deckState.burnedCards;
		const deckState = input.deckState;
		const returnedCardsThatHaveBeenPlayed = deckState.cardsPlayedThisMatch
			.map((c) => deckState.findCard(c.entityId)?.card)
			.filter(
				(c) =>
					!!c?.cardId &&
					c.creatorCardId === CardIds.GodfreyTheBetrayer_GodfreysAtlasEnchantment_JAIL_509e,
			);

		// Remove cards that we know have been returned already. Take care of duplicates - if the card has been burned twice,
		// and the returnedPlayed has been played once, we should still send back the card once.
		const candidates = overdrawnCards.map((c) => c.cardId);
		for (const card of returnedCardsThatHaveBeenPlayed) {
			const index = candidates.indexOf(card!.cardId);
			if (index !== -1) {
				candidates.splice(index, 1);
			}
		}
		return {
			possibleCards: candidates,
		};
	},
};
