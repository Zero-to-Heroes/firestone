import { CardsFacadeService } from '@firestone/shared/framework/core';
import { DeckState } from '../../models/deck-state';
import { Card, GeneratingCard } from './_card.type';

export const DirdraRebelCaptain: Card & GeneratingCard = {
	getPossibleCardsReceivedInHand: (
		creatorCardId: string,
		deckState: DeckState,
		allCards: CardsFacadeService,
	): readonly string[] => {
		const allCrewmates =
			allCards.getCard(creatorCardId).relatedCardDbfIds?.map((dbfId) => allCards.getCard(dbfId)?.id) ?? [];
		const crewmatesLeftInDeck = allCrewmates.filter((crewmate) =>
			deckState
				.getAllCardsInDeck()
				.map((c) => c.cardId)
				.includes(crewmate),
		);
		return crewmatesLeftInDeck;
	},
};
