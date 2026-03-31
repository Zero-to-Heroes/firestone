import { AllCardsService, GameTag, hasMechanic, ReferenceCard } from '@firestone-hs/reference-data';

import { DeckState } from '../models/deck-state';

// When mousing over a Riff card in hand, show the most recent Riff played this match
export const getLastRiffPlayed = (
	refCard: ReferenceCard,
	deckState: DeckState,
	allCards: AllCardsService,
): readonly string[] => {
	if (!hasMechanic(refCard, GameTag.RIFF) && !refCard.referencedTags?.includes(GameTag[GameTag.RIFF])) {
		return [];
	}

	const cardsPlayed = deckState.cardsPlayedThisMatch ?? [];
	// Iterate in reverse to find the most recently played Riff card
	for (let i = cardsPlayed.length - 1; i >= 0; i--) {
		const played = cardsPlayed[i];
		if (!played.cardId) {
			continue;
		}
		const playedCard = allCards.getCard(played.cardId);
		if (playedCard && hasMechanic(playedCard, GameTag.RIFF)) {
			return [played.cardId];
		}
	}

	return [];
};
